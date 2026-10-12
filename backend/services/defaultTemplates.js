/**
 * Standard Nextvora Email Templates with modern HTML responsive design,
 * branded with violet/purple gradients, clear typography, and {{variables}}.
 */

const defaultTemplates = [
    {
        name: 'كود التحقق لتفعيل الحساب (Registration OTP)',
        slug: 'registration-otp',
        subject: 'كود التحقق الخاص بك لتفعيل حساب Nextvora: {{otp_code}}',
        variables: ['name', 'otp_code', 'platform_name', 'expires_in'],
        body_text: 'مرحباً {{name}}، كود التحقق الخاص بك في منصة Nextvora هو: {{otp_code}}. صالح لمدة {{expires_in}} دقيقة.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Nextvora</h1>
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
        🔒 لأسباب أمنية، لا تشارك هذا الرمز مع أي شخص. فريق الدعم في Nextvora لن يطلب منك هذا الرمز أبداً.
      </p>
    </div>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - جميع الحقوق محفوظة.
  </div>
</div>`
    },

    {
        name: 'الترحيب بالعضو الجديد (Welcome Member)',
        slug: 'welcome-member',
        subject: 'أهلاً بك في منصة Nextvora! ابدأ رحلتك التعليمية والمالية الآن 🚀',
        variables: ['name', 'email', 'referral_link', 'login_url', 'platform_name'],
        body_text: 'مرحباً {{name}}، أهلاً بك في Nextvora. حسابك مفعل الآن وجاهز للاستخدام.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;">Nextvora Academy</h1>
    <p style="color: #ddd6fe; margin: 8px 0 0 0; font-size: 15px;">بوابتك نحو التعلّم والنمو المالي والريادة</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0;">أهلاً وسهلاً بك يا {{name}} 🎉</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.8;">
      يسعدنا جداً انضمامك إلى أسرة <strong>{{platform_name}}</strong>! تم إعداد حسابك بنجاح وأصبح بإمكانك الآن استكشاف الباقات التعليمية، تطوير مهاراتك، والبدء في بناء فريقك وشبكتك التسويقية.
    </p>

    <div style="background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 25px 0;">
      <h3 style="color: #701a75; font-size: 15px; margin: 0 0 10px 0; font-weight: 700;">🔗 رابط الإحالة الخاص بك (Affiliate Link):</h3>
      <div style="background-color: #ffffff; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; color: #4338ca; font-family: monospace; word-break: break-all;">
        {{referral_link}}
      </div>
      <p style="color: #701a75; font-size: 12px; margin: 8px 0 0 0;">شارك هذا الرابط لدعوة أعضاء جدد إلى فريقك والربح من عمولات الأجيال الخمسة!</p>
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
        variables: ['name', 'amount', 'currency', 'generation', 'source_user', 'wallet_balance', 'platform_name'],
        body_text: 'تهانينا يا {{name}}! لقد استلمت عمولة جديدة بقيمة {{amount}} {{currency}} من الجيل {{generation}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">أرباح جديدة في محفظتك 💸</h1>
    <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;">Nextvora Affiliate System</p>
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
        <td style="padding: 12px 0; color: #64748b;">الرصيد الكلي في المحفظة الآن:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left; font-family: monospace;">{{wallet_balance}} {{currency}}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 0; color: #64748b;">تاريخ العملية:</td>
        <td style="padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left;">{{date}}</td>
      </tr>
    </table>

    <div style="text-align: center; margin: 30px 0 10px 0;">
      <a href="{{wallet_url}}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; font-size: 14px;">
        عرض محفظتك وسحب الأرباح ➔
      </a>
    </div>
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
      يسرنا إبلاغك بأن الإدارة قامت بالتحقق من إيصال الدفع الخاص بك والموافقة على شحن رصيد محفظتك بنجاح.
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
        name: 'الموافقة على طلب السحب وتحويل المبلغ (Withdrawal Approved)',
        slug: 'withdrawal-approved',
        subject: 'تمت معالجة وتحويل طلب السحب الخاص بك بقيمة ${{amount}} 🏦',
        variables: ['name', 'amount', 'currency', 'payment_method', 'transaction_proof', 'date', 'platform_name'],
        body_text: 'مرحباً {{name}}، تمت معالجة طلب سحب أرباحك بقيمة {{amount}} {{currency}} عبر {{payment_method}} بنجاح.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم تحويل أرباحك بنجاح 🏦</h1>
    <p style="color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;">Nextvora Financial Department</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      يسعدنا إعلامك بأنه تمت الموافقة على طلب سحب أرباحك وإتمام عملية التحويل المالي إلى حسابك.
    </p>

    <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 20px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">المبلغ المحول:</td>
          <td style="padding: 10px 0; font-weight: 900; color: #4338ca; text-align: left; font-size: 18px; font-family: monospace;">{{amount}} {{currency}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">طريقة الدفع / التحويل:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left;">{{payment_method}}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e0e7ff;">
          <td style="padding: 10px 0; color: #3730a3;">إثبات / مرجع التحويل:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;">{{transaction_proof}}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #3730a3;">تاريخ الإتمام:</td>
          <td style="padding: 10px 0; font-weight: 600; color: #475569; text-align: left;">{{date}}</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 13px;">
      قد يستغرق ظهور الرصيد في حسابك البنكي أو محفظتك الخارجية وقتاً يسيراً حسب الجهة المالية المحددة.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - الإدارة المالية.
  </div>
</div>`
    },

    {
        name: 'تأكيد شراء باقة اشتراك (Package Purchase)',
        slug: 'package-purchased',
        subject: 'تهانينا! تم تفعيل باقة {{package_name}} الخاصة بك بنجاح 🎓',
        variables: ['name', 'package_name', 'price', 'currency', 'tier', 'platform_name'],
        body_text: 'مرحباً {{name}}، تم تفعيل باقة {{package_name}} الخاصة بك بنجاح بقيمة {{price}} {{currency}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم تفعيل باقتك بنجاح! 🎓</h1>
    <p style="color: #f3e8ff; margin: 6px 0 0 0; font-size: 14px;">Nextvora Educational Membership</p>
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
        name: 'إعادة تعيين كلمة المرور (Password Reset)',
        slug: 'password-reset',
        subject: 'طلب إعادة تعيين كلمة المرور الخاصة بحسابك في Nextvora',
        variables: ['name', 'reset_link', 'expires_in', 'platform_name'],
        body_text: 'مرحباً {{name}}، لقد تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم الرابط التالي: {{reset_link}}.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #334155 0%, #1e293b 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">إعادة تعيين كلمة المرور 🔐</h1>
    <p style="color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;">Nextvora Security Center</p>
  </div>
  
  <div style="padding: 35px 30px;">
    <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;">مرحباً {{name}}،</h2>
    <p style="color: #475569; font-size: 15px; line-height: 1.7;">
      تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>{{platform_name}}</strong>. إذا كنت أنت من قام بهذا الطلب، يمكنك إنشاء كلمة مرور جديدة عبر النقر على الزر أدناه:
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 16px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(109, 40, 217, 0.35);">
        إعادة تعيين كلمة المرور ➔
      </a>
    </div>

    <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
      هذا الرابط صالح للاستخدام لمدة {{expires_in}} دقيقة فقط. إذا لم تكن قد طلبت تغيير كلمة المرور، فيمكنك تجاهل هذه الرسالة بأمان وستبقى بيانات حسابك محمية.
    </p>
  </div>
  
  <div style="background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;">
    © {{platform_name}} - مركز الأمان والحماية.
  </div>
</div>`
    },

    {
        name: 'تم التحقق من الهوية بنجاح (KYC Approved)',
        slug: 'kyc-approved',
        subject: 'تهانينا! تم توثيق وتأكيد هويتك في Nextvora بنجاح (KYC Verified) 🛡️',
        variables: ['name', 'platform_name', 'dashboard_url'],
        body_text: 'مرحباً {{name}}، تمت مراجعة مستنداتك وتوثيق حسابك بنجاح.',
        body_html: `
<div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);">
  <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 35px 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">تم توثيق الحساب بنجاح 🛡️</h1>
    <p style="color: #bae6fd; margin: 6px 0 0 0; font-size: 14px;">Nextvora Identity Verification</p>
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
    }
];

module.exports = defaultTemplates;
