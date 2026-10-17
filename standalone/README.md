# فلوسي — نسخة Next.js + Supabase المستقلة

نفس واجهة فلوسي وحساباته، مع دخول Google أو بريد وكلمة مرور، وحفظ Postgres مرتبط بمستخدم Supabase. النسخة دي منفصلة في الاستضافة عن نسخة Sites القديمة؛ ما بتغيّرش بياناتها ولا صلاحياتها. واجهة الدفتر والمنطق المالي مشتركان مع ملفات المشروع الأساسية.

**الحالة:** الكود والجداول جاهزين للفحص؛ تفعيل Google ورابط الإنتاج واختبار دخول حقيقي لسه مطلوبين. الإرسال اليومي مش متصل. حذف الدفتر يمسح بيانات التطبيق، ولا يحذف هوية Supabase Auth أو حساب Google نفسه.

## تشغيل محلي

من جذر المستودع، استخدم نسخة pnpm المحددة في package.json وNode22.13 أو أحدث:

```sh
pnpm install --frozen-lockfile
```

انسخ `standalone/.env.example` إلى `standalone/.env.local`. حط Project URL وPublishable key من مشروعك، وAPP_ORIGIN يساوي أصل الرابط بالضبط بدون شرطة في الآخر. ما تستخدمش service_role أو Secret key.

```sh
pnpm --dir standalone dev
pnpm --dir standalone build
```

## إعداد Supabase

مخطط الجداول والدوال موثّق في `sql/bootstrap.sql`. اتطبق على مشروع صاحب التطبيق بالفعل؛ **ما تعيدش تشغيله على نفس المشروع**. لو بتستخدم مشروع جديد، راجع السكريبت ثم طبّقه مرة واحدة. سياسات RLS تربط كل صف بالمستخدم وبجلسة Auth فعّالة؛ الدوال تعمل بصلاحية المستخدم، والمقارنة بالنسخة بتحمي الكتابة من التعارض.

- Authentication → URL Configuration: ضع رابط تطبيقك في Site URL، وأضف `https://YOUR_APP/auth/callback` إلى Redirect URLs. استخدم رابط محدد بدل wildcard.
- Authentication → Sign In / Providers → Google: فعّل المزود بعد إضافة Google Web Client ID وClient Secret. حط السر مباشرة في Supabase، مش في GitHub أو الشات.
- Google Cloud: Authorized JavaScript origin هو `https://YOUR_APP`. Authorized redirect URI هو رابط Supabase Callback الظاهر في إعدادات مزود Google (ينتهي بـ `/auth/v1/callback`). ده مختلف عن callback التطبيق اللي فوق.
- استخدم scopes الأساسية openid/email/profile فقط. لو شاشة Google في وضع Testing، أضف حسابك إلى Test users.
- البريد وكلمة المرور يستخدمان إعدادات Supabase Auth. إرسال التأكيد في الإنتاج محتاج SMTP مناسب؛ المرسل الافتراضي قد يقصر الإرسال على العناوين المصرح بها وبحدود منخفضة. لا يوجد مرسل بريد مفعل في هذا الكود.

## النشر على Vercel

اعمل Import للمستودع نفسه، واختر Root Directory = `standalone` وFramework = Next.js. حافظ على خيار تضمين ملفات خارج Root Directory لأنه بيستخدم واجهة ومنطق المشروع المشتركين. التثبيت من workspace root بـpnpm والـlockfile الموجود.

أضف متغيرات السيرفر `SUPABASE_URL` و`SUPABASE_PUBLISHABLE_KEY` و`APP_ORIGIN` إلى Production، وAPP_ORIGIN رابطك النهائي على vercel.app أو دومينك. بعد تغيير المتغيرات اعمل Redeploy. ما تحتاجش شراء دومين.

كل API يراجع المستخدم فعليًا عبر Auth، والـcookies HttpOnly/SameSite=Lax وSecure على HTTPS. تجديد الجلسة يتم داخل Route Handlers اللي تسمح بكتابة cookies؛ صفحاتنا لا تقرأ بيانات الحساب في Server Components. ردود الحساب لا تُخزن في CDN. لا تضف Server Component محميًا بدون إعداد proxy لتجديد الجلسة وفق دليل Supabase.

## اختبار قبل اعتبار الدخول مفعّلًا

1. Google → callback → ظهور حسابك، ثم Reload واستمرار الجلسة.
2. سجّل عملية وتأكد من حفظها؛ اختبر حسابًا ثانيًا لا يرى بيانات الأول.
3. الخروج ثم إعادة فتح الصفحة: بيانات الحساب لا تظهر بدون دخول. الضيف منفصل على الجهاز.
4. اختبر رفض الموافقة ورابط callback ناقص أو غير صحيح.
5. نقل الدفتر القديم: صدّر JSON من النسخة القديمة واستورده بعد الدخول في النسخة الجديدة. لا يوجد ربط تلقائي بالبريد أو نقل تلقائي للبيانات.

اختبارات SQL ببيانات مصطنعة نجحت في RLS وCAS وإعادة المحاولة والتصفير والحذف ومنع الجلسة الملغاة؛ كلها داخل transaction تم التراجع عنها. الاختبار ده لا يساوي تجربة OAuth حقيقية من المتصفح.
