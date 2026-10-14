/**
 * Standard Nexyvora Email Templates with modern HTML responsive design,
 * branded with violet/purple gradients, clear typography, and {{variables}}.
 */

const defaultTemplates = [
    {
        name: 'كود التحقق لتفعيل الحساب (Registration OTP)',
        slug: 'registration-otp',
        subject: 'كود التحقق الخاص بك لتفعيل حساب Nexyvora: {{otp_code}}',
        variables: ['name', 'otp_code', 'platform_name', 'expires_in'],
        body_text: 'مرحباً {{name}}، كود التحقق الخاص بك في منصة Nexyvora هو: {{otp_code}}. صالح لمدة {{expires_in}} دقيقة.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nexyvora</h1>
    <p style="color: #ede9fe; margin: 8px 0 0 0; font-size: 14px;">تفعيل الحساب والتحقق من الهوية</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً بك {{name}} 👋</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      شكراً لانضمامك إلى مجتمع <strong>{{platform_name}}</strong>. لتأكيد حسابك والبدء في استخدام كافة ميزات المنصة، يرجى إدخال رمز التحقق (OTP) التالي:
    </p>
    
    <div style="margin: 30px 0; text-align: center;">
      <div style="display: inline-block; background-color: #f5f3ff; border: 2px dashed #a855f7; border-radius: 16px; padding: 18px 36px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #6d28d9; font-family: monospace;">
        {{otp_code}}
      </div>
      <p style="color: #64748b; font-size: 13px; margin-top: 10px;">هذا الرمز صالح للاستخدام لمدة {{expires_in}} دقيقة فقط.</p>
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-top: 25px;">
      <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
        🔒 لأسباب أمنية، لا تشارك هذا الرمز مع أي شخص. فريق الدعم في Nexyvora لن يطلب منك هذا الرمز أبداً.
      </p>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - جميع الحقوق محفوظة.
  </div>
</div>`
    },

    {
        name: 'إعادة تعيين كلمة المرور (Password Reset)',
        slug: 'password-reset',
        subject: 'كود إعادة تعيين كلمة المرور لحسابك في Nexyvora: {{otp_code}}',
        variables: ['name', 'otp_code', 'reset_link', 'expires_in', 'platform_name'],
        body_text: 'مرحباً {{name}}، رمز إعادة تعيين كلمة المرور لحسابك في Nexyvora هو: {{otp_code}}. صالح لمدة {{expires_in}} دقيقة.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #334155 0%, #1e293b 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">إعادة تعيين كلمة المرور 🔐</h1>
    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Security Center</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>{{platform_name}}</strong>. يرجى استخدام رمز التحقق التالي لتعيين كلمة مرور جديدة:
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <div style="display: inline-block; background-color: #f1f5f9; border: 2px dashed #64748b; border-radius: 16px; padding: 18px 36px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">
        {{otp_code}}
      </div>
      <p style="color: #64748b; font-size: 13px; margin-top: 10px;">هذا الرمز صالح للاستخدام لمدة {{expires_in}} دقيقة فقط.</p>
    </div>

    <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-top: 25px;">
      <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
        🔒 إذا لم تكن قد طلبت تغيير كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان وستظل كلمة مرورك الحالية آمنة دون أي تغيير.
      </p>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - مركز الأمان والحماية.
  </div>
</div>`
    },

    {
        name: 'تنبيه أمني: تم تغيير كلمة المرور (Password Changed)',
        slug: 'password-changed',
        subject: 'تنبيه أمني: تم تغيير كلمة مرور حسابك في Nexyvora بنجاح 🛡️',
        variables: ['name', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، نود إعلامك بأنه تم تغيير كلمة المرور لحسابك في Nexyvora بنجاح بتاريخ {{date}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تنبيه أمان الحساب 🛡️</h1>
    <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Security Alert</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      نحيطك علماً بأنه قد تم تحديث كلمة المرور الخاصة بحسابك في <strong>{{platform_name}}</strong> بنجاح.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 16px; margin: 20px 0;">
      <p style="color: #166534; font-size: 14px; margin: 0; font-weight: 600;">
        ✔ تاريخ التحديث: {{date}}<br/>
        ✔ تم تسجيل خروج كافة الجلسات الأخرى لضمان أمان حسابك.
      </p>
    </div>

    <p style="color: #dc2626; font-size: 13px; line-height: 1.6; font-weight: 600;">
      ⚠️ إذا لم تكن أنت من قام بهذا التغيير، يرجى التواصل فوراً مع فريق الدعم الفني لاستعادة وتأمين حسابك.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - مركز الأمان والحماية.
  </div>
</div>`
    },

    {
        name: 'الترحيب بالعضو الجديد (Welcome Member)',
        slug: 'welcome-member',
        subject: 'أهلاً بك في منصة Nexyvora! ابدأ رحلتك التعليمية والمالية الآن 🚀',
        variables: ['name', 'email', 'referral_link', 'login_url', 'platform_name'],
        body_text: 'مرحباً {{name}}، أهلاً بك في Nexyvora. حسابك مفعل الآن وجاهز للاستخدام.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Nexyvora Academy</h1>
    <p style="color: #ddd6fe; margin: 8px 0 0 0; font-size: 15px;">بوابتك نحو التعلّم والنمو المالي والريادة</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0;">أهلاً وسهلاً بك يا {{name}} 🎉</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">
      يسعدنا جداً انضمامك إلى أسرة <strong>{{platform_name}}</strong>! تم إعداد حسابك بنجاح وأصبح بإمكانك الآن استكشاف الباقات التعليمية، وتطوير مهاراتك، وبناء فريقك التسويقي.
    </p>

    <div style="background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #701a75; font-size: 15px; margin: 0 0 10px 0; font-weight: 700;">🔗 رابط الإحالة الخاص بك (Affiliate Link):</h3>
      <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; color: #4338ca; font-family: monospace; word-break: break-all;">
        {{referral_link}}
      </div>
      <p style="color: #701a75; font-size: 12px; margin: 8px 0 0 0;">شارك هذا الرابط لدعوة أعضاء جدد إلى فريقك والربح من عمولات الأجيال!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 16px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(109, 40, 217, 0.35);">
        تسجيل الدخول إلى حسابك ➔
      </a>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - فريق النجاح والشراكة.
  </div>
</div>`
    },

    {
        name: 'إشعار استلام عمولة وأرباح جديدة (Commission Earned)',
        slug: 'commission-earned',
        subject: 'مبروك! استلمت عمولة جديدة بقيمة ${{amount}} في محفظتك 💰',
        variables: ['name', 'amount', 'currency', 'generation', 'source_user', 'wallet_balance', 'date', 'platform_name'],
        body_text: 'تهانينا يا {{name}}! لقد استلمت عمولة جديدة بقيمة {{amount}} {{currency}} من الجيل {{generation}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">أرباح جديدة في محفظتك 💸</h1>
    <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Affiliate System</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">تهانينا الحارة يا {{name}}! 🌟</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      يسعدنا إعلامك بأنه تم إضافة عمولة تسويقية جديدة إلى رصيد محفظتك بفضل نشاط شبكتك وفريقك التسويقي.
    </p>

    <div style="background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 18px; padding: 24px; text-align: center; margin: 25px 0;">
      <span style="display: block; font-size: 13px; color: #047857; font-weight: 700; text-transform: uppercase;">مبلغ العمولة المكتسب</span>
      <span style="display: block; font-size: 36px; font-weight: 900; color: #065f46; font-family: monospace; margin: 6px 0;">
        +{{amount}} {{currency}}
      </span>
      <div style="display: inline-block; background-color: #d1fae5; color: #065f46; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700;">
        من الجيل رقم: {{generation}} (العضو: {{source_user}})
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; color: #64748b;">الرصيد الكلي بالمحفظة الآن:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left; font-family: monospace;">{{wallet_balance}} {{currency}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; color: #64748b;">تاريخ العملية:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left;">{{date}}</td>
      </tr>
    </table>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - نموك هو نجاحنا المشترك.
  </div>
</div>`
    },

    {
        name: 'تأكيد شحن المحفظة / إيداع ناجح (Deposit Approved)',
        slug: 'deposit-approved',
        subject: 'تمت الموافقة على طلب الإيداع بقيمة ${{amount}} في محفظتك ✅',
        variables: ['name', 'amount', 'currency', 'transaction_id', 'new_balance', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، تمت الموافقة على إيداعك بقيمة {{amount}} {{currency}} ورصيدك الحالي أصبح {{new_balance}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تأكيد شحن الرصيد ✅</h1>
    <p style="color: #dbeafe; margin: 6px 0 0 0; font-size: 14px;">معاملة مالية ناجحة</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      يسرنا إبلاغك بأنه تم تأكيد شحن رصيد محفظتك وإضافة المبلغ بنجاح.
    </p>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #dbeafe;">
          <td style="padding: 10px 0; color: #1e40af;">المبلغ المودع:</td>
          <td style="padding: 10px 0; font-weight: 900; color: #1d4ed8; text-align: left; font-size: 18px; font-family: monospace;">+{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dbeafe;">
          <td style="padding: 10px 0; color: #1e40af;">رقم المعاملة:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;">{{transaction_id}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #dbeafe;">
          <td style="padding: 10px 0; color: #1e40af;">الرصيد الجديد بالمحفظة:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #16a34a; text-align: left; font-family: monospace;">{{new_balance}} {{currency}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #1e40af;">التاريخ:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      يمكنك الآن استخدام هذا الرصيد لشراء الباقات التدريبية أو تفعيل الخدمات والترقيات في أي وقت.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'رفض طلب شحن المحفظة (Deposit Rejected)',
        slug: 'deposit-rejected',
        subject: 'تحديث بشأن طلب الإيداع الخاص بك في Nexyvora ⚠️',
        variables: ['name', 'amount', 'currency', 'reason', 'transaction_id', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، نأسف لإعلامك بأنه تم رفض طلب الإيداع بقيمة {{amount}} {{currency}}. السبب: {{reason}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.08);">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تحديث طلب الإيداع ⚠️</h1>
    <p style="color: #fee2e2; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Financial Review</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      نأسف لإعلامك بأنه بعد مراجعة طلب الإيداع الخاص بك، لم تتمكن الإدارة المالية من اعتماده نظراً لعدم تطابق البيانات أو عدم وضوح إثبات الدفع.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 10px 0; color: #991b1b;">المبلغ المطلوب:</td>
          <td style="padding: 10px 0; font-weight: 800; color: #b91c1c; text-align: left; font-family: monospace;">{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 10px 0; color: #991b1b;">سبب الرفض:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #dc2626; text-align: left;">{{reason}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #991b1b;">التاريخ:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      يمكنك إعادة تقديم طلب إيداع جديد والتأكد من إرفاق وصل دفع صحيح وواضح. إذا كان لديك استفسار، يرجى مراسلة الدعم الفني.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'تسجيل طلب سحب أرباح (Withdrawal Requested)',
        slug: 'withdrawal-requested',
        subject: 'تم تسجيل طلب سحب أرباحك بقيمة ${{amount}} بنجاح ⏳',
        variables: ['name', 'amount', 'currency', 'payment_method', 'withdrawal_id', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، تم استلام طلب سحب أرباحك بقيمة {{amount}} {{currency}} عبر {{payment_method}} وهو قيد المراجعة.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم تسجيل طلب السحب ⏳</h1>
    <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Payout Request</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      تلقينا طلبك لسحب الأرباح من محفظتك. تمت مراجعة الرصيد وخصم المبلغ مؤقتاً تمهيداً لمعالجة التحويل من قبل الإدارة المالية.
    </p>

    <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">المبلغ المطلوب سحبه:</td>
          <td style="padding: 10px 0; font-weight: 900; color: #4338ca; text-align: left; font-size: 18px; font-family: monospace;">{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">طريقة الاستلام:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left;">{{payment_method}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">رقم الطلب:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;">{{withdrawal_id}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #3730a3;">تاريخ التقديم:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      تتم مراجعة ومعالجة طلبات السحب في أسرع وقت. ستصلك رسالة تأكيد إضافية فور إتمام التحويل المالي وإرفاق إثبات الدفع.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'الموافقة على طلب السحب وتحويل المبلغ (Withdrawal Approved)',
        slug: 'withdrawal-approved',
        subject: 'تمت معالجة وتحويل طلب السحب الخاص بك بقيمة ${{amount}} 🏦',
        variables: ['name', 'amount', 'currency', 'payment_method', 'transaction_proof', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، تمت معالجة طلب سحب أرباحك بقيمة {{amount}} {{currency}} عبر {{payment_method}} بنجاح.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم تحويل أرباحك بنجاح 🏦</h1>
    <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Financial Department</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      يسعدنا إعلامك بأنه تمت الموافقة على طلب سحب أرباحك وإتمام عملية التحويل المالي إلى حسابك.
    </p>

    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #d1fae5;">
          <td style="padding: 10px 0; color: #065f46;">المبلغ المحول:</td>
          <td style="padding: 10px 0; font-weight: 900; color: #047857; text-align: left; font-size: 18px; font-family: monospace;">{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #d1fae5;">
          <td style="padding: 10px 0; color: #065f46;">طريقة الدفع / التحويل:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left;">{{payment_method}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #d1fae5;">
          <td style="padding: 10px 0; color: #065f46;">إثبات / مرجع التحويل:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;">{{transaction_proof}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #065f46;">تاريخ الإتمام:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      قد يستغرق ظهور الرصيد في حسابك البنكي أو محفظتك الخارجية وقتاً يسيراً بحسب الجهة المالية المحددة.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'رفض طلب السحب واسترجاع الرصيد (Withdrawal Rejected)',
        slug: 'withdrawal-rejected',
        subject: 'تحديث بشأن طلب سحب الأرباح: تم رفض الطلب واسترجاع الرصيد ⚠️',
        variables: ['name', 'amount', 'currency', 'reason', 'refunded_balance', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، نود إعلامك بأنه تم رفض طلب السحب بقيمة {{amount}} {{currency}} واسترجاع المبلغ لمحفظتك. السبب: {{reason}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.08);">
  <div style="background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تحديث طلب السحب ⚠️</h1>
    <p style="color: #ffe4e6; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Financial Department</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      نحيطك علماً بأنه قد تم رفض طلب سحب الأرباح الخاص بك، وتم <strong>استرجاع كامل المبلغ تلقائياً</strong> إلى رصيد محفظتك المتاح.
    </p>

    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #ffe4e6;">
          <td style="padding: 10px 0; color: #9f1239;">المبلغ المسترجع:</td>
          <td style="padding: 10px 0; font-weight: 800; color: #be123c; text-align: left; font-family: monospace;">+{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffe4e6;">
          <td style="padding: 10px 0; color: #9f1239;">سبب الرفض:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #e11d48; text-align: left;">{{reason}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #ffe4e6;">
          <td style="padding: 10px 0; color: #9f1239;">رصيد محفظتك المتاح الآن:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #16a34a; text-align: left; font-family: monospace;">{{refunded_balance}} {{currency}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #9f1239;">التاريخ:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      يرجى التحقق من صحة تفاصيل حسابك البنكي أو عنوان محفظتك وإعادة تقديم الطلب، أو التواصل مع الدعم الفني لمساعدتك.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'تأكيد شراء وتفعيل الباقة (Package Purchase)',
        slug: 'package-purchased',
        subject: 'تهانينا! تم تفعيل باقة {{package_name}} الخاصة بك بنجاح 🎓',
        variables: ['name', 'package_name', 'price', 'currency', 'tier', 'date', 'academy_url', 'platform_name'],
        body_text: 'مرحباً {{name}}، تم تفعيل باقة {{package_name}} الخاصة بك بنجاح بقيمة {{price}} {{currency}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم تفعيل باقتك بنجاح! 🎓</h1>
    <p style="color: #f3e8ff; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Educational Membership</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">أهلاً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      تهانينا! تم تفعيل باقتك التعليمية الجديدة بنجاح، ويمكنك الآن الوصول الفوري إلى جميع الدورات والمميزات الحصرية المشمولة في باقتك.
    </p>

    <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #f3e8ff;">
          <td style="padding: 10px 0; color: #6b21a8;">اسم الباقة:</td>
          <td style="padding: 10px 0; font-weight: 900; color: #7e22ce; text-align: left; font-size: 16px;">{{package_name}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3e8ff;">
          <td style="padding: 10px 0; color: #6b21a8;">المستوى / الفئة:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #1e293b; text-align: left; text-transform: uppercase;">{{tier}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f3e8ff;">
          <td style="padding: 10px 0; color: #6b21a8;">القيمة:</td>
          <td style="padding: 10px 0; font-weight: 800; color: #047857; text-align: left; font-family: monospace;">{{price}} {{currency}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b21a8;">تاريخ التفعيل:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="{{academy_url}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 14px; font-weight: 700; font-size: 14px;">
        بدء مشاهدة الدورات والدروس ➔
      </a>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - أكاديمية التميز.
  </div>
</div>`
    },

    {
        name: 'رفض طلب تفعيل الباقة (Package Purchase Rejected)',
        slug: 'package-rejected',
        subject: 'تحديث بشأن طلب تفعيل الباقة في Nexyvora ⚠️',
        variables: ['name', 'package_name', 'reason', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، نأسف لإعلامك بأنه تم رفض طلب تفعيل باقة {{package_name}}. السبب: {{reason}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.08);">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تحديث طلب الباقة ⚠️</h1>
    <p style="color: #fee2e2; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Membership Review</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      نأسف لإعلامك بأنه لم يتم اعتماد طلب تفعيل باقة <strong>{{package_name}}</strong>.
    </p>

    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 10px 0; color: #991b1b;">الباقة:</td>
          <td style="padding: 10px 0; font-weight: 800; color: #1e293b; text-align: left;">{{package_name}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #fee2e2;">
          <td style="padding: 10px 0; color: #991b1b;">سبب عدم الاعتماد:</td>
          <td style="padding: 10px 0; font-weight: 700; color: #dc2626; text-align: left;">{{reason}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #991b1b;">التاريخ:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      يمكنك إعادة تقديم الطلب مع إرفاق وصل دفع صحيح وواضح، أو التواصل مع فريق الدعم للمساعدة.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - إدارة الاشتراكات.
  </div>
</div>`
    },

    {
        name: 'تم التحقق من الهوية بنجاح (KYC Approved)',
        slug: 'kyc-approved',
        subject: 'تهانينا! تم توثيق وتأكيد هويتك في Nexyvora بنجاح (KYC Verified) 🛡️',
        variables: ['name', 'platform_name', 'dashboard_url'],
        body_text: 'مرحباً {{name}}، تمت مراجعة مستنداتك وتوثيق حسابك بنجاح.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم توثيق الحساب بنجاح 🛡️</h1>
    <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Identity Verification</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      يسرنا إعلامك بأن فريق التدقيق الأمني قام بمراجعة مستندات إثبات الهوية (KYC) الخاصة بك، وتمت الموافقة عليها بنجاح.
    </p>

    <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 18px; margin: 20px 0; text-align: center;">
      <span style="display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px;">
        حسابك الآن: موثّق بالكامل (Verified Account)
      </span>
      <p style="color: #0369a1; font-size: 13px; margin: 10px 0 0 0;">
        تم فتح جميع حدود المعاملات المالية، وسحب الأرباح دون أي قيود.
      </p>
    </div>

    <div style="text-align: center; margin: 25px 0 10px 0;">
      <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; font-size: 14px;">
        الذهاب إلى لوحة التحكم ➔
      </a>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - فريق الأمان والامتثال.
  </div>
</div>`
    },

    {
        name: 'رفض مستندات التحقق من الهوية (KYC Rejected)',
        slug: 'kyc-rejected',
        subject: 'تحديث بشأن توثيق الهوية في Nexyvora: يرجى مراجعة المستندات ⚠️',
        variables: ['name', 'reason', 'dashboard_url', 'platform_name'],
        body_text: 'مرحباً {{name}}، لم يتم قبول مستندات التحقق من الهوية الخاصة بك. السبب: {{reason}}. يرجى إعادة رفع مستندات واضحة.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #fee2e2; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(239, 68, 68, 0.08);">
  <div style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تحديث توثيق الهوية ⚠️</h1>
    <p style="color: #fef3c7; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Identity Verification</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      نود إعلامك بأنه بعد مراجعة مستندات إثبات الهوية (KYC) المرفوعة، لم يتمكن فريق الامتثال من اعتمادها للسبب التالي:
    </p>

    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 18px; margin: 20px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 700;">
        السبب: {{reason}}
      </p>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
      يرجى التأكد من أن صورة الهوية ملونة، سارية الصلاحية، وواضحة البيانات دون أي تمويه أو انعكاسات ضوئية، ثم إعادة رفعها عبر لوحة التحكم.
    </p>

    <div style="text-align: center; margin: 25px 0 10px 0;">
      <a href="{{dashboard_url}}" style="display: inline-block; background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; font-size: 14px;">
        إعادة رفع المستندات ➔
      </a>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - فريق الأمان والامتثال.
  </div>
</div>`
    },

    {
        name: 'إشعار استلام مكافأة الحوض المالي (Bonus Pool Reward)',
        slug: 'bonus-pool-reward',
        subject: 'تهانينا! حصلت على حصتك من {{pool_name}} بقيمة ${{amount}} 🎉',
        variables: ['name', 'pool_name', 'amount', 'currency', 'period', 'wallet_balance', 'date', 'platform_name'],
        body_text: 'تهانينا يا {{name}}! لقد حصلت على حصتك من {{pool_name}} بقيمة {{amount}} {{currency}} عن فترة {{period}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #b45309 0%, #d97706 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">مكافأة الحوض المالي للقيادة 🏆</h1>
    <p style="color: #fef3c7; margin: 6px 0 0 0; font-size: 14px;">Nexyvora Leadership Bonus Pool</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">تهانينا الحارة يا {{name}}! 🌟</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      تقديراً لإنجازك القيادي المتميز ونشاط فريقك، يسعدنا إعلامك بأنه تم إيداع حصتك الشهرية من <strong>{{pool_name}}</strong> في محفظتك بنجاح!
    </p>

    <div style="background-color: #fffbeb; border: 2px solid #fde68a; border-radius: 18px; padding: 24px; text-align: center; margin: 25px 0;">
      <span style="display: block; font-size: 13px; color: #92400e; font-weight: 700; text-transform: uppercase;">المكافأة المستحقة</span>
      <span style="display: block; font-size: 36px; font-weight: 900; color: #78350f; font-family: monospace; margin: 6px 0;">
        +{{amount}} {{currency}}
      </span>
      <div style="display: inline-block; background-color: #fef3c7; color: #92400e; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700;">
        عن فترة: {{period}}
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; color: #64748b;">الرصيد الكلي في المحفظة الآن:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left; font-family: monospace;">{{wallet_balance}} {{currency}}</td>
      </tr>
      <tr>
        <td style="padding: 12px 0; color: #64748b;">تاريخ التوزيع:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left;">{{date}}</td>
      </tr>
    </table>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - فخورون بنجاحك وقيادتك.
  </div>
</div>`
    }
];

module.exports = defaultTemplates;
