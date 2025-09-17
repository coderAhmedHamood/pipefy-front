const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pipefy API - نظام إدارة المستخدمين والأدوار والصلاحيات',
      version: '1.0.0',
      description: `
        نظام شامل لإدارة المستخدمين والأدوار والصلاحيات باستخدام Express.js و PostgreSQL.
        
        `,
      contact: {
        name: 'Pipefy API Support',
        email: 'support@pipefy.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.pipefy.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'معرف المستخدم الفريد'
            },
            name: {
              type: 'string',
              description: 'اسم المستخدم الكامل',
              example: 'أحمد محمد'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'البريد الإلكتروني',
              example: 'ahmed@example.com'
            },
            avatar_url: {
              type: 'string',
              format: 'uri',
              description: 'رابط صورة المستخدم',
              nullable: true
            },
            role_id: {
              type: 'string',
              format: 'uuid',
              description: 'معرف الدور'
            },
            role: {
              $ref: '#/components/schemas/Role'
            },
            is_active: {
              type: 'boolean',
              description: 'حالة تفعيل المستخدم'
            },
            email_verified: {
              type: 'boolean',
              description: 'حالة تأكيد البريد الإلكتروني'
            },
            phone: {
              type: 'string',
              description: 'رقم الهاتف',
              nullable: true
            },
            timezone: {
              type: 'string',
              description: 'المنطقة الزمنية',
              default: 'Asia/Riyadh'
            },
            language: {
              type: 'string',
              description: 'اللغة المفضلة',
              default: 'ar'
            },
            preferences: {
              type: 'object',
              description: 'تفضيلات المستخدم'
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              description: 'آخر دخول',
              nullable: true
            },
            login_attempts: {
              type: 'integer',
              description: 'عدد محاولات الدخول الفاشلة'
            },
            locked_until: {
              type: 'string',
              format: 'date-time',
              description: 'مقفل حتى',
              nullable: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ الإنشاء'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ آخر تحديث'
            },
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Permission'
              },
              description: 'صلاحيات المستخدم'
            }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'معرف الدور الفريد'
            },
            name: {
              type: 'string',
              description: 'اسم الدور',
              example: 'admin'
            },
            description: {
              type: 'string',
              description: 'وصف الدور',
              example: 'مدير النظام'
            },
            is_system_role: {
              type: 'boolean',
              description: 'هل هو دور نظام'
            },
            is_active: {
              type: 'boolean',
              description: 'حالة تفعيل الدور'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ الإنشاء'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ آخر تحديث'
            },
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Permission'
              },
              description: 'صلاحيات الدور'
            },
            users_count: {
              type: 'integer',
              description: 'عدد المستخدمين في هذا الدور'
            }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'معرف الصلاحية الفريد'
            },
            name: {
              type: 'string',
              description: 'اسم الصلاحية',
              example: 'إدارة المستخدمين'
            },
            resource: {
              type: 'string',
              description: 'المورد',
              example: 'users'
            },
            action: {
              type: 'string',
              description: 'الإجراء',
              example: 'manage'
            },
            description: {
              type: 'string',
              description: 'وصف الصلاحية'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'تاريخ الإنشاء'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'البريد الإلكتروني',
              example: 'admin@example.com'
            },
            password: {
              type: 'string',
              description: 'كلمة المرور',
              example: 'admin123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                token: {
                  type: 'string',
                  description: 'JWT Token'
                },
                expires_in: {
                  type: 'string',
                  description: 'مدة انتهاء صلاحية التوكن',
                  example: '24h'
                }
              }
            },
            message: {
              type: 'string',
              example: 'تم تسجيل الدخول بنجاح'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'حالة نجاح العملية'
            },
            data: {
              type: 'object',
              description: 'البيانات المرجعة'
            },
            message: {
              type: 'string',
              description: 'رسالة الاستجابة'
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'رقم الصفحة الحالية'
                },
                per_page: {
                  type: 'integer',
                  description: 'عدد العناصر في الصفحة'
                },
                total: {
                  type: 'integer',
                  description: 'العدد الإجمالي للعناصر'
                },
                total_pages: {
                  type: 'integer',
                  description: 'العدد الإجمالي للصفحات'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'رسالة الخطأ'
            },
            error: {
              type: 'string',
              description: 'كود الخطأ'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
