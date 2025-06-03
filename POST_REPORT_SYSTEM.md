# Sistema de Denúncia de Posts - Backend Implementation

## Banco de Dados (Prisma Schema)

```prisma
model PostReport {
  id        String   @id @default(cuid())
  postId    String
  reporterId String
  reason    String
  details   String?
  status    ReportStatus @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post     Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  reporter User @relation(fields: [reporterId], references: [id], onDelete: Cascade)

  @@unique([postId, reporterId]) // Usuário só pode denunciar um post uma vez
  @@map("post_reports")
}

enum ReportStatus {
  PENDING
  REVIEWED
  APPROVED
  REJECTED
}

// Adicionar no modelo Post
model Post {
  // ... campos existentes
  reports PostReport[]
}

// Adicionar no modelo User
model User {
  // ... campos existentes
  postReports PostReport[] @relation("PostReporter")
}
```

## Controller (NestJS)

```typescript
// src/social/posts/posts.controller.ts
@Post(':id/report')
@UseGuards(JwtAuthGuard)
async reportPost(
  @Param('id') postId: string,
  @Body() reportDto: CreatePostReportDto,
  @GetUser() user: User,
) {
  return this.postsService.reportPost(postId, user.id, reportDto);
}

@Get('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
async getReports(
  @Query() query: GetReportsQueryDto,
) {
  return this.postsService.getReports(query);
}

@Patch('reports/:id/status')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'MODERATOR')
async updateReportStatus(
  @Param('id') reportId: string,
  @Body() updateDto: UpdateReportStatusDto,
  @GetUser() user: User,
) {
  return this.postsService.updateReportStatus(reportId, updateDto, user);
}
```

## DTOs

```typescript
// src/social/posts/dto/create-post-report.dto.ts
export class CreatePostReportDto {
  @IsString()
  @IsIn(['spam', 'inappropriate', 'harassment', 'fake', 'copyright', 'other'])
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

// src/social/posts/dto/get-reports-query.dto.ts
export class GetReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

// src/social/posts/dto/update-report-status.dto.ts
export class UpdateReportStatusDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderatorNotes?: string;
}
```

## Service

```typescript
// src/social/posts/posts.service.ts
async reportPost(postId: string, reporterId: string, reportDto: CreatePostReportDto) {
  // Verificar se o post existe
  const post = await this.prisma.post.findUnique({
    where: { id: postId },
    include: { author: true }
  });

  if (!post) {
    throw new NotFoundException('Post não encontrado');
  }

  // Verificar se o usuário não está tentando denunciar próprio post
  if (post.author.id === reporterId) {
    throw new BadRequestException('Você não pode denunciar seu próprio post');
  }

  // Verificar se já existe denúncia deste usuário para este post
  const existingReport = await this.prisma.postReport.findUnique({
    where: {
      postId_reporterId: {
        postId,
        reporterId
      }
    }
  });

  if (existingReport) {
    throw new ConflictException('Você já denunciou este post');
  }

  // Criar a denúncia
  const report = await this.prisma.postReport.create({
    data: {
      postId,
      reporterId,
      reason: reportDto.reason,
      details: reportDto.details,
    },
    include: {
      post: {
        include: { author: true }
      },
      reporter: true
    }
  });

  // Opcional: Enviar notificação para moderadores
  await this.notificationService.notifyModerators('NEW_POST_REPORT', {
    reportId: report.id,
    postId,
    reason: reportDto.reason
  });

  return {
    message: 'Denúncia enviada com sucesso',
    reportId: report.id
  };
}

async getReports(query: GetReportsQueryDto) {
  const { page = 1, limit = 20, status, reason } = query;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.status = status;
  if (reason) where.reason = reason;

  const [reports, total] = await Promise.all([
    this.prisma.postReport.findMany({
      where,
      include: {
        post: {
          include: { author: true }
        },
        reporter: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    this.prisma.postReport.count({ where })
  ]);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

async updateReportStatus(
  reportId: string, 
  updateDto: UpdateReportStatusDto, 
  moderator: User
) {
  const report = await this.prisma.postReport.findUnique({
    where: { id: reportId },
    include: {
      post: { include: { author: true } },
      reporter: true
    }
  });

  if (!report) {
    throw new NotFoundException('Denúncia não encontrada');
  }

  // Atualizar status da denúncia
  const updatedReport = await this.prisma.postReport.update({
    where: { id: reportId },
    data: {
      status: updateDto.status,
      moderatorNotes: updateDto.moderatorNotes,
      reviewedAt: new Date(),
      reviewedBy: moderator.id
    }
  });

  // Se aprovado, tomar ação no post
  if (updateDto.status === ReportStatus.APPROVED) {
    await this.handleApprovedReport(report);
  }

  // Notificar usuário que fez a denúncia
  await this.notificationService.notifyUser(report.reporter.id, 'REPORT_REVIEWED', {
    status: updateDto.status,
    postId: report.postId
  });

  return updatedReport;
}

private async handleApprovedReport(report: PostReport) {
  // Ações que podem ser tomadas:
  // 1. Remover o post
  // 2. Marcar como oculto
  // 3. Advertir o autor
  // 4. Suspender o autor (casos graves)

  switch (report.reason) {
    case 'spam':
    case 'inappropriate':
      // Ocultar post
      await this.prisma.post.update({
        where: { id: report.postId },
        data: { isHidden: true }
      });
      break;
    
    case 'harassment':
    case 'fake':
      // Remover post e advertir usuário
      await this.prisma.post.delete({
        where: { id: report.postId }
      });
      
      await this.userService.addWarning(report.post.author.id, {
        reason: report.reason,
        details: `Post removido por: ${report.reason}`
      });
      break;
    
    default:
      // Avaliar caso a caso
      break;
  }
}
```

## Frontend - Integração Adicional

```typescript
// src/contexts/ModerationContext.tsx (para admins)
interface ModerationContextType {
  reports: PostReport[];
  loading: boolean;
  loadReports: () => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
}

// src/services/moderationService.ts
class ModerationService {
  async getReports(query: GetReportsQuery): Promise<ReportsResponse> {
    const response = await api.get('/social/posts/reports', { params: query });
    return response.data;
  }

  async updateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
    await api.patch(`/social/posts/reports/${reportId}/status`, { status });
  }
}
```

## Notificações

```typescript
// Notificar moderadores sobre nova denúncia
{
  type: 'NEW_POST_REPORT',
  title: 'Nova Denúncia de Post',
  message: `Post denunciado por ${reason}`,
  data: { reportId, postId }
}

// Notificar usuário sobre resultado da denúncia
{
  type: 'REPORT_REVIEWED',
  title: 'Sua Denúncia foi Analisada',
  message: status === 'APPROVED' 
    ? 'Ação foi tomada sobre o conteúdo denunciado'
    : 'O conteúdo foi considerado apropriado',
  data: { reportId, status }
}
```

## Analytics

```typescript
// Métricas para monitorar
- Número de denúncias por dia/semana
- Tipos de denúncia mais comuns
- Taxa de aprovação de denúncias
- Usuários com mais denúncias
- Posts mais denunciados
- Tempo médio de análise de denúncias
```

## Considerações de Segurança

1. **Rate Limiting**: Limitar número de denúncias por usuário por período
2. **Validação**: Verificar se usuário pode denunciar (não bloqueado, ativo)
3. **Logs**: Registrar todas as ações de moderação
4. **Anonimato**: Não revelar quem fez a denúncia
5. **Escalação**: Sistema para casos graves que precisam atenção imediata

## Testes

```typescript
describe('Post Reports', () => {
  it('should create report successfully', async () => {
    // Test report creation
  });

  it('should not allow duplicate reports', async () => {
    // Test duplicate prevention
  });

  it('should not allow self-reporting', async () => {
    // Test self-report prevention
  });

  it('should handle approved reports correctly', async () => {
    // Test post action on approval
  });
});
```

Este sistema fornece uma base sólida para moderação de conteúdo e proteção da comunidade. 