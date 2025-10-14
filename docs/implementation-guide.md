# دليل التطبيق التقني - نظام إدارة العمليات

## هيكل المشروع المقترح

### Backend Structure
```
backend/
├── src/
│   ├── controllers/          # تحكم في الطلبات
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── processes.controller.ts
│   │   ├── tickets.controller.ts
│   │   ├── automation.controller.ts
│   │   ├── reports.controller.ts
│   │   └── integrations.controller.ts
│   ├── services/             # منطق العمل
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── tickets.service.ts
│   │   ├── automation.service.ts
│   │   ├── notifications.service.ts
│   │   └── integrations.service.ts
│   ├── models/               # نماذج البيانات
│   │   ├── user.model.ts
│   │   ├── process.model.ts
│   │   ├── ticket.model.ts
│   │   └── activity.model.ts
│   ├── middleware/           # وسطاء
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── permissions.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── routes/               # مسارات API
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── processes.routes.ts
│   │   └── tickets.routes.ts
│   ├── utils/                # أدوات مساعدة
│   │   ├── validation.ts
│   │   ├── encryption.ts
│   │   ├── email.ts
│   │   └── file-upload.ts
│   ├── config/               # إعدادات
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── environment.ts
│   └── types/                # تعريفات الأنواع
│       ├── api.types.ts
│       ├── database.types.ts
│       └── common.types.ts
├── migrations/               # هجرات قاعدة البيانات
├── seeds/                    # بيانات أولية
├── tests/                    # اختبارات
└── docs/                     # توثيق
```

---

## تطبيق Controllers

### Auth Controller
```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto, RefreshTokenDto } from '../types/auth.types';
import { validateDto } from '../utils/validation';

export class AuthController {
  private authService = new AuthService();

  async login(req: Request, res: Response) {
    try {
      const loginData = await validateDto(LoginDto, req.body);
      
      const result = await this.authService.login(
        loginData.email, 
        loginData.password,
        req.ip,
        req.get('User-Agent')
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم تسجيل الدخول بنجاح'
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'بيانات الدخول غير صحيحة',
          details: error.message
        }
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refresh_token } = await validateDto(RefreshTokenDto, req.body);
      
      const result = await this.authService.refreshToken(refresh_token);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: 'فشل في تجديد التوكن'
        }
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await this.authService.logout(token);

      res.status(200).json({
        success: true,
        message: 'تم تسجيل الخروج بنجاح'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: 'خطأ في تسجيل الخروج'
        }
      });
    }
  }
}
```

### Tickets Controller
```typescript
// src/controllers/tickets.controller.ts
import { Request, Response } from 'express';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto, UpdateTicketDto, MoveTicketDto } from '../types/ticket.types';
import { validateDto } from '../utils/validation';
import { checkPermissions } from '../middleware/permissions.middleware';

export class TicketsController {
  private ticketsService = new TicketsService();

  async getTickets(req: Request, res: Response) {
    try {
      const filters = {
        process_id: req.query.process_id as string,
        stage_id: req.query.stage_id as string,
        assigned_to: req.query.assigned_to as string,
        priority: req.query.priority as string,
        is_overdue: req.query.is_overdue === 'true',
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        per_page: Math.min(parseInt(req.query.per_page as string) || 20, 100)
      };

      const result = await this.ticketsService.getTickets(
        req.user.id, 
        filters
      );

      res.status(200).json({
        success: true,
        data: result.tickets,
        meta: {
          total: result.total,
          page: filters.page,
          per_page: filters.per_page,
          total_pages: Math.ceil(result.total / filters.per_page),
          filters_applied: Object.fromEntries(
            Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
          )
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_TICKETS_FAILED',
          message: 'فشل في جلب التذاكر'
        }
      });
    }
  }

  async createTicket(req: Request, res: Response) {
    try {
      const ticketData = await validateDto(CreateTicketDto, req.body);
      
      // التحقق من الصلاحيات
      await checkPermissions(req.user.id, 'tickets', 'create', ticketData.process_id);

      const ticket = await this.ticketsService.createTicket(
        ticketData,
        req.user.id,
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        data: ticket,
        message: 'تم إنشاء التذكرة بنجاح'
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'البيانات المرسلة غير صحيحة',
            details: error.details
          }
        });
      } else if (error.name === 'PermissionError') {
        res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'صلاحيات غير كافية'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'CREATE_TICKET_FAILED',
            message: 'فشل في إنشاء التذكرة'
          }
        });
      }
    }
  }

  async moveTicket(req: Request, res: Response) {
    try {
      const ticketId = req.params.id;
      const moveData = await validateDto(MoveTicketDto, req.body);

      const result = await this.ticketsService.moveTicket(
        ticketId,
        moveData.to_stage_id,
        req.user.id,
        moveData.comment,
        moveData.update_data
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'تم نقل التذكرة بنجاح'
      });
    } catch (error) {
      if (error.name === 'NotFoundError') {
        res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: 'التذكرة غير موجودة'
          }
        });
      } else if (error.name === 'TransitionError') {
        res.status(400).json({
          success: false,
          error: {
            code: 'STAGE_TRANSITION_NOT_ALLOWED',
            message: 'الانتقال للمرحلة غير مسموح'
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'MOVE_TICKET_FAILED',
            message: 'فشل في نقل التذكرة'
          }
        });
      }
    }
  }
}
```

---

## تطبيق Services

### Tickets Service
```typescript
// src/services/tickets.service.ts
import { DatabaseService } from './database.service';
import { NotificationService } from './notifications.service';
import { AutomationService } from './automation.service';
import { AuditService } from './audit.service';
import { CreateTicketDto, TicketFilters } from '../types/ticket.types';

export class TicketsService {
  private db = new DatabaseService();
  private notifications = new NotificationService();
  private automation = new AutomationService();
  private audit = new AuditService();

  async getTickets(userId: string, filters: TicketFilters) {
    // بناء الاستعلام مع الفلاتر
    let query = this.db.tickets
      .select('*')
      .from('tickets_detailed')
      .where('deleted_at', 'IS', null);

    // تطبيق الفلاتر
    if (filters.process_id) {
      query = query.where('process_id', '=', filters.process_id);
    }

    if (filters.stage_id) {
      query = query.where('current_stage_id', '=', filters.stage_id);
    }

    if (filters.assigned_to) {
      query = query.where('assigned_to', '=', filters.assigned_to);
    }

    if (filters.priority) {
      query = query.where('priority', '=', filters.priority);
    }

    if (filters.is_overdue) {
      query = query.where('is_overdue', '=', true);
    }

    if (filters.search) {
      query = query.where(
        'to_tsvector(\'arabic\', title || \' \' || COALESCE(description, \'\'))',
        '@@',
        `plainto_tsquery('arabic', '${filters.search}')`
      );
    }

    // ترتيب النتائج
    query = query.orderBy('created_at', 'desc');

    // Pagination
    const offset = (filters.page - 1) * filters.per_page;
    query = query.limit(filters.per_page).offset(offset);

    const tickets = await query.execute();
    const total = await this.getTicketsCount(filters);

    return { tickets, total };
  }

  async createTicket(ticketData: CreateTicketDto, userId: string, ipAddress?: string, userAgent?: string) {
    const transaction = await this.db.beginTransaction();
    
    try {
      // إنشاء التذكرة
      const ticket = await this.db.tickets.insert({
        ...ticketData,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date()
      }).returning('*').executeTakeFirst();

      // تسجيل النشاط
      await this.db.ticket_activities.insert({
        ticket_id: ticket.id,
        user_id: userId,
        activity_type: 'created',
        description: 'تم إنشاء التذكرة',
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date()
      }).execute();

      // تطبيق قواعد الأتمتة
      await this.automation.triggerRules('ticket_created', {
        ticket,
        user_id: userId
      });

      // إرسال إشعارات
      if (ticket.assigned_to) {
        await this.notifications.sendNotification({
          user_id: ticket.assigned_to,
          title: 'تذكرة جديدة تم إسنادها إليك',
          message: `تم إسناد التذكرة "${ticket.title}" إليك`,
          type: 'ticket_assigned',
          data: { ticket_id: ticket.id }
        });
      }

      await transaction.commit();

      // تسجيل في سجل التدقيق
      await this.audit.log({
        user_id: userId,
        action: 'CREATE',
        resource_type: 'ticket',
        resource_id: ticket.id,
        new_values: ticket,
        ip_address: ipAddress
      });

      return ticket;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async moveTicket(ticketId: string, toStageId: string, userId: string, comment?: string, updateData?: any) {
    const transaction = await this.db.beginTransaction();
    
    try {
      // جلب التذكرة الحالية
      const currentTicket = await this.db.tickets
        .selectFrom('tickets')
        .selectAll()
        .where('id', '=', ticketId)
        .executeTakeFirst();

      if (!currentTicket) {
        throw new Error('TICKET_NOT_FOUND');
      }

      // التحقق من صحة الانتقال
      const isValidTransition = await this.validateStageTransition(
        currentTicket.current_stage_id,
        toStageId,
        userId
      );

      if (!isValidTransition) {
        throw new Error('STAGE_TRANSITION_NOT_ALLOWED');
      }

      // جلب معلومات المراحل
      const [currentStage, targetStage] = await Promise.all([
        this.db.stages.selectFrom('stages').selectAll().where('id', '=', currentTicket.current_stage_id).executeTakeFirst(),
        this.db.stages.selectFrom('stages').selectAll().where('id', '=', toStageId).executeTakeFirst()
      ]);

      // تحديث التذكرة
      const updatedTicket = await this.db.tickets
        .updateTable('tickets')
        .set({
          current_stage_id: toStageId,
          updated_at: new Date(),
          ...(updateData || {})
        })
        .where('id', '=', ticketId)
        .returning('*')
        .executeTakeFirst();

      // تسجيل النشاط
      await this.db.ticket_activities.insert({
        ticket_id: ticketId,
        user_id: userId,
        activity_type: 'stage_changed',
        description: `تم نقل التذكرة من مرحلة "${currentStage?.name}" إلى مرحلة "${targetStage?.name}"`,
        old_value: { stage_id: currentStage?.id, stage_name: currentStage?.name },
        new_value: { stage_id: targetStage?.id, stage_name: targetStage?.name },
        field_name: 'المرحلة',
        created_at: new Date()
      }).execute();

      // إضافة تعليق إذا تم توفيره
      if (comment) {
        await this.db.ticket_comments.insert({
          ticket_id: ticketId,
          user_id: userId,
          content: comment,
          is_internal: false,
          created_at: new Date()
        }).execute();
      }

      // تطبيق قواعد الأتمتة
      await this.automation.triggerRules('stage_changed', {
        ticket: updatedTicket,
        old_stage_id: currentTicket.current_stage_id,
        new_stage_id: toStageId,
        user_id: userId
      });

      await transaction.commit();

      return {
        id: ticketId,
        current_stage_id: toStageId,
        previous_stage_id: currentTicket.current_stage_id,
        moved_at: new Date(),
        moved_by: userId
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async validateStageTransition(fromStageId: string, toStageId: string, userId: string): Promise<boolean> {
    // جلب قواعد الانتقال
    const transitionRules = await this.db.transition_rules
      .selectFrom('transition_rules')
      .selectAll()
      .where('from_stage_id', '=', fromStageId)
      .where('to_stage_id', '=', toStageId)
      .execute();

    if (transitionRules.length === 0) {
      return false; // لا توجد قاعدة انتقال
    }

    // التحقق من الصلاحيات المطلوبة
    for (const rule of transitionRules) {
      if (rule.required_permissions && rule.required_permissions.length > 0) {
        const hasPermissions = await this.checkUserPermissions(
          userId, 
          rule.required_permissions
        );
        if (!hasPermissions) {
          return false;
        }
      }

      // التحقق من الشروط
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(
          rule.conditions,
          fromStageId
        );
        if (!conditionsMet) {
          return false;
        }
      }
    }

    return true;
  }
}
```

---

## تطبيق Automation Service

### Automation Service
```typescript
// src/services/automation.service.ts
import { DatabaseService } from './database.service';
import { NotificationService } from './notifications.service';
import { EmailService } from './email.service';
import { AutomationRule, AutomationTrigger } from '../types/automation.types';

export class AutomationService {
  private db = new DatabaseService();
  private notifications = new NotificationService();
  private email = new EmailService();

  async triggerRules(event: string, context: any) {
    try {
      // جلب القواعد النشطة للحدث
      const rules = await this.db.automation_rules
        .selectFrom('automation_rules')
        .selectAll()
        .where('trigger_event', '=', event)
        .where('is_active', '=', true)
        .execute();

      for (const rule of rules) {
        await this.executeRule(rule, context);
      }
    } catch (error) {
      console.error('Automation trigger failed:', error);
      // تسجيل الخطأ دون إيقاف العملية الأساسية
    }
  }

  private async executeRule(rule: AutomationRule, context: any) {
    const executionId = crypto.randomUUID();
    
    try {
      // تسجيل بداية التنفيذ
      await this.db.automation_executions.insert({
        id: executionId,
        rule_id: rule.id,
        ticket_id: context.ticket?.id,
        trigger_data: context,
        status: 'pending',
        executed_at: new Date()
      }).execute();

      // التحقق من الشروط
      if (rule.conditions && rule.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(rule.conditions, context);
        if (!conditionsMet) {
          await this.updateExecutionStatus(executionId, 'skipped', 'الشروط غير مستوفاة');
          return;
        }
      }

      // تنفيذ الإجراءات
      const executedActions = [];
      for (const action of rule.actions) {
        try {
          const result = await this.executeAction(action, context);
          executedActions.push({ action: action.type, result, status: 'success' });
        } catch (actionError) {
          executedActions.push({ 
            action: action.type, 
            error: actionError.message, 
            status: 'failed' 
          });
        }
      }

      // تحديث حالة التنفيذ
      const hasFailures = executedActions.some(a => a.status === 'failed');
      const status = hasFailures ? 'partial' : 'success';
      
      await this.updateExecutionStatus(executionId, status, null, executedActions);

      // تحديث إحصائيات القاعدة
      await this.updateRuleStatistics(rule.id, status === 'success');

    } catch (error) {
      await this.updateExecutionStatus(executionId, 'failed', error.message);
      await this.updateRuleStatistics(rule.id, false);
    }
  }

  private async executeAction(action: any, context: any) {
    switch (action.type) {
      case 'send_notification':
        return await this.executeNotificationAction(action, context);
      
      case 'send_email':
        return await this.executeEmailAction(action, context);
      
      case 'move_to_stage':
        return await this.executeMoveStageAction(action, context);
      
      case 'update_field':
        return await this.executeUpdateFieldAction(action, context);
      
      case 'create_ticket':
        return await this.executeCreateTicketAction(action, context);
      
      default:
        throw new Error(`نوع الإجراء غير مدعوم: ${action.type}`);
    }
  }

  private async executeNotificationAction(action: any, context: any) {
    const { parameters } = action;
    
    // معالجة المتغيرات في النص
    const title = this.processTemplate(parameters.title, context);
    const message = this.processTemplate(parameters.message, context);
    
    // تحديد المستقبلين
    const recipients = await this.resolveRecipients(parameters.recipients, context);
    
    // إرسال الإشعارات
    for (const recipientId of recipients) {
      await this.notifications.sendNotification({
        user_id: recipientId,
        title,
        message,
        type: 'automation_triggered',
        data: {
          rule_id: context.rule_id,
          ticket_id: context.ticket?.id
        }
      });
    }

    return { recipients_count: recipients.length };
  }

  private async executeEmailAction(action: any, context: any) {
    const { parameters } = action;
    
    const subject = this.processTemplate(parameters.subject, context);
    const recipients = await this.resolveEmailRecipients(parameters.recipients, context);
    
    // إرسال البريد الإلكتروني
    const emailResult = await this.email.sendEmail({
      to: recipients,
      subject,
      template: parameters.template,
      variables: this.processTemplateVariables(parameters.variables, context)
    });

    return { email_sent: emailResult.success, recipients_count: recipients.length };
  }

  private processTemplate(template: string, context: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

---

## Middleware للأمان والتحقق

### Authentication Middleware
```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/database.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'التوكن مطلوب للوصول'
        }
      });
    }

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // التحقق من وجود الجلسة
    const db = new DatabaseService();
    const session = await db.user_sessions
      .selectFrom('user_sessions')
      .selectAll()
      .where('user_id', '=', decoded.userId)
      .where('token_hash', '=', hashToken(token))
      .where('is_active', '=', true)
      .where('expires_at', '>', new Date())
      .executeTakeFirst();

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_SESSION_INVALID',
          message: 'الجلسة غير صحيحة أو منتهية الصلاحية'
        }
      });
    }

    // جلب بيانات المستخدم والصلاحيات
    const user = await db.users
      .selectFrom('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('role_permissions', 'roles.id', 'role_permissions.role_id')
      .leftJoin('permissions as rp', 'role_permissions.permission_id', 'rp.id')
      .leftJoin('user_permissions', 'users.id', 'user_permissions.user_id')
      .leftJoin('permissions as up', 'user_permissions.permission_id', 'up.id')
      .select([
        'users.id',
        'users.name',
        'users.email',
        'roles.name as role_name',
        'users.is_active'
      ])
      .where('users.id', '=', decoded.userId)
      .where('users.is_active', '=', true)
      .executeTakeFirst();

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'المستخدم غير موجود أو معطل'
        }
      });
    }

    // جلب الصلاحيات
    const permissions = await getUserPermissions(decoded.userId);

    // تحديث آخر نشاط
    await db.user_sessions
      .updateTable('user_sessions')
      .set({ last_activity: new Date() })
      .where('id', '=', session.id)
      .execute();

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role_name,
      permissions
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          message: 'انتهت صلاحية التوكن'
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'التوكن غير صحيح'
      }
    });
  }
};

async function getUserPermissions(userId: string): Promise<string[]> {
  const db = new DatabaseService();
  
  const permissions = await db
    .selectFrom('users')
    .leftJoin('roles', 'users.role_id', 'roles.id')
    .leftJoin('role_permissions', 'roles.id', 'role_permissions.role_id')
    .leftJoin('permissions as rp', 'role_permissions.permission_id', 'rp.id')
    .leftJoin('user_permissions', 'users.id', 'user_permissions.user_id')
    .leftJoin('permissions as up', 'user_permissions.permission_id', 'up.id')
    .select(['rp.resource', 'rp.action', 'up.resource', 'up.action'])
    .where('users.id', '=', userId)
    .execute();

  const permissionSet = new Set<string>();
  
  permissions.forEach(p => {
    if (p.resource && p.action) {
      permissionSet.add(`${p.resource}:${p.action}`);
    }
  });

  return Array.from(permissionSet);
}
```

### Permissions Middleware
```typescript
// src/middleware/permissions.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requirePermission = (resource: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const requiredPermission = `${resource}:${action}`;
    
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'صلاحيات غير كافية',
          required_permission: requiredPermission
        }
      });
    }

    next();
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const hasAnyPermission = permissions.some(permission => 
      req.user.permissions.includes(permission)
    );

    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'صلاحيات غير كافية',
          required_permissions: permissions
        }
      });
    }

    next();
  };
};
```

---

## تطبيق Routes

### Tickets Routes
```typescript
// src/routes/tickets.routes.ts
import { Router } from 'express';
import { TicketsController } from '../controllers/tickets.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permissions.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { rateLimit } from '../middleware/rate-limit.middleware';

const router = Router();
const ticketsController = new TicketsController();

// تطبيق المصادقة على جميع المسارات
router.use(authenticateToken);

// جلب التذاكر
router.get('/', 
  requirePermission('tickets', 'view'),
  rateLimit({ windowMs: 60000, max: 100 }), // 100 طلب في الدقيقة
  ticketsController.getTickets.bind(ticketsController)
);

// جلب تذكرة محددة
router.get('/:id',
  requirePermission('tickets', 'view'),
  ticketsController.getTicket.bind(ticketsController)
);

// إنشاء تذكرة جديدة
router.post('/',
  requirePermission('tickets', 'create'),
  validateRequest('CreateTicketDto'),
  rateLimit({ windowMs: 60000, max: 20 }), // 20 إنشاء في الدقيقة
  ticketsController.createTicket.bind(ticketsController)
);

// تحديث تذكرة
router.put('/:id',
  requirePermission('tickets', 'edit'),
  validateRequest('UpdateTicketDto'),
  ticketsController.updateTicket.bind(ticketsController)
);

// نقل تذكرة
router.put('/:id/move',
  requirePermission('tickets', 'edit'),
  validateRequest('MoveTicketDto'),
  ticketsController.moveTicket.bind(ticketsController)
);

// حذف تذكرة
router.delete('/:id',
  requirePermission('tickets', 'delete'),
  ticketsController.deleteTicket.bind(ticketsController)
);

// إضافة تعليق
router.post('/:id/comments',
  requirePermission('tickets', 'comment'),
  validateRequest('CreateCommentDto'),
  ticketsController.addComment.bind(ticketsController)
);

// رفع مرفق
router.post('/:id/attachments',
  requirePermission('tickets', 'attach'),
  upload.single('file'),
  ticketsController.uploadAttachment.bind(ticketsController)
);

export default router;
```

---

## تطبيق Validation

### Data Transfer Objects (DTOs)
```typescript
// src/types/ticket.types.ts
import { IsString, IsUUID, IsOptional, IsEnum, IsDateString, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTicketDto {
  @IsString({ message: 'العنوان مطلوب' })
  @Length(1, 500, { message: 'العنوان يجب أن يكون بين 1 و 500 حرف' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'الوصف لا يجب أن يتجاوز 5000 حرف' })
  description?: string;

  @IsUUID('4', { message: 'معرف العملية غير صحيح' })
  process_id: string;

  @IsUUID('4', { message: 'معرف المرحلة غير صحيح' })
  current_stage_id: string;

  @IsOptional()
  @IsUUID('4', { message: 'معرف المستخدم المكلف غير صحيح' })
  assigned_to?: string;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الاستحقاق غير صحيح' })
  due_date?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'], { message: 'الأولوية غير صحيحة' })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsUUID('4')
  assigned_to?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class MoveTicketDto {
  @IsUUID('4', { message: 'معرف المرحلة المستهدفة غير صحيح' })
  to_stage_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'التعليق لا يجب أن يتجاوز 1000 حرف' })
  comment?: string;

  @IsOptional()
  @IsBoolean()
  notify_assigned?: boolean;

  @IsOptional()
  @IsObject()
  update_data?: Record<string, any>;
}
```

---

## إعدادات البيئة والنشر

### متغيرات البيئة
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/workflow_system
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis (للتخزين المؤقت والجلسات)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=your-email-password
EMAIL_FROM=noreply@company.com
EMAIL_FROM_NAME=نظام إدارة العمليات

# File Storage
STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=workflow-attachments

# Application
NODE_ENV=production
PORT=3003
API_VERSION=v1
CORS_ORIGIN=https://app.workflow-system.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-session-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Features
ENABLE_AUTOMATION=true
ENABLE_WEBHOOKS=true
ENABLE_FILE_UPLOADS=true
MAX_FILE_SIZE_MB=50
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3003

CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/workflow_system
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: workflow_system
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass password
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## اختبارات شاملة

### Unit Tests Example
```typescript
// tests/services/tickets.service.test.ts
import { TicketsService } from '../../src/services/tickets.service';
import { DatabaseService } from '../../src/services/database.service';
import { CreateTicketDto } from '../../src/types/ticket.types';

describe('TicketsService', () => {
  let ticketsService: TicketsService;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = createMockDatabase();
    ticketsService = new TicketsService(mockDb);
  });

  describe('createTicket', () => {
    it('should create a ticket successfully', async () => {
      const ticketData: CreateTicketDto = {
        title: 'تذكرة اختبار',
        process_id: 'process_123',
        current_stage_id: 'stage_1',
        priority: 'medium'
      };

      const mockTicket = {
        id: 'ticket_123',
        ...ticketData,
        created_by: 'user_123',
        created_at: new Date()
      };

      mockDb.tickets.insert.mockResolvedValue(mockTicket);

      const result = await ticketsService.createTicket(ticketData, 'user_123');

      expect(result).toEqual(mockTicket);
      expect(mockDb.tickets.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'تذكرة اختبار',
          created_by: 'user_123'
        })
      );
    });

    it('should throw validation error for invalid data', async () => {
      const invalidData = {
        title: '', // عنوان فارغ
        process_id: 'invalid-uuid'
      };

      await expect(
        ticketsService.createTicket(invalidData as any, 'user_123')
      ).rejects.toThrow('VALIDATION_ERROR');
    });
  });

  describe('moveTicket', () => {
    it('should move ticket to valid stage', async () => {
      const ticketId = 'ticket_123';
      const toStageId = 'stage_2';
      const userId = 'user_123';

      mockDb.tickets.selectFrom.mockResolvedValue({
        id: ticketId,
        current_stage_id: 'stage_1'
      });

      const result = await ticketsService.moveTicket(ticketId, toStageId, userId);

      expect(result.current_stage_id).toBe(toStageId);
      expect(mockDb.ticket_activities.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          activity_type: 'stage_changed'
        })
      );
    });
  });
});
```

### Integration Tests
```typescript
// tests/integration/tickets.integration.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';

describe('Tickets API Integration', () => {
  let authToken: string;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // تسجيل دخول للحصول على توكن
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('POST /tickets', () => {
    it('should create a new ticket', async () => {
      const ticketData = {
        title: 'تذكرة اختبار',
        description: 'وصف تذكرة الاختبار',
        process_id: 'test_process_id',
        current_stage_id: 'test_stage_id',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(ticketData.title);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        title: '', // عنوان فارغ
        process_id: 'invalid-uuid'
      };

      const response = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /tickets/:id/move', () => {
    it('should move ticket to new stage', async () => {
      // إنشاء تذكرة أولاً
      const createResponse = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'تذكرة للنقل',
          process_id: 'test_process_id',
          current_stage_id: 'stage_1',
          priority: 'medium'
        });

      const ticketId = createResponse.body.data.id;

      // نقل التذكرة
      const moveResponse = await request(app)
        .put(`/api/v1/tickets/${ticketId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to_stage_id: 'stage_2',
          comment: 'تم الانتهاء من المراجعة'
        })
        .expect(200);

      expect(moveResponse.body.success).toBe(true);
      expect(moveResponse.body.data.current_stage_id).toBe('stage_2');
    });
  });
});
```

---

## مراقبة الأداء والسجلات

### Logging Configuration
```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
      });
    })
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

export default logger;
```

### Performance Monitoring
```typescript
// src/middleware/performance.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/database.service';
import logger from '../utils/logger';

export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    // تسجيل في قاعدة البيانات للتحليل
    try {
      const db = new DatabaseService();
      await db.performance_logs.insert({
        endpoint: req.path,
        http_method: req.method,
        response_time_ms: responseTime,
        status_code: res.statusCode,
        user_id: req.user?.id,
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        request_size_bytes: JSON.stringify(req.body).length,
        response_size_bytes: res.get('Content-Length') || 0,
        created_at: new Date()
      }).execute();
    } catch (error) {
      logger.error('Failed to log performance data:', error);
    }

    // تسجيل في السجلات
    logger.info('API Request', {
      method: req.method,
      url: req.path,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id
    });

    // تنبيه للطلبات البطيئة
    if (responseTime > 1000) {
      logger.warn('Slow API Request', {
        method: req.method,
        url: req.path,
        responseTime: `${responseTime}ms`,
        userId: req.user?.id
      });
    }
  });

  next();
};
```

هذا الدليل التقني الشامل يوفر لفريق الـ Backend جميع المعلومات والأدوات المطلوبة لتطوير نظام إدارة العمليات بشكل احترافي ومتكامل، مع التركيز على الأمان والأداء وقابلية الصيانة.