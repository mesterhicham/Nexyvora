import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatformSettings, useUpdatePlatformSetting } from '@/hooks/useAdminFeatures';
import { 
  ShieldCheck, 
  FileText, 
  Building2, 
  ShieldAlert, 
  Lock, 
  CreditCard, 
  Save, 
  ExternalLink, 
  RotateCcw, 
  CheckCircle2, 
  Eye, 
  Edit3,
  Calendar,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export interface PolicyDefinition {
  id: string;
  slug: string;
  settingKey: string;
  icon: any;
  titleFr: string;
  titleAr: string;
  titleEn: string;
  descFr: string;
  descAr: string;
  defaultContentFr: string;
  defaultContentAr: string;
}

export const DEFAULT_POLICIES: PolicyDefinition[] = [
  {
    id: 'terms',
    slug: 'conditions-generales',
    settingKey: 'policy_terms_content',
    icon: FileText,
    titleFr: 'Conditions Générales',
    titleAr: 'الشروط والأحكام العامة',
    titleEn: 'Terms & Conditions',
    descFr: "Cadre contractuel régissant l'utilisation des services de formation et de l'académie Nexyvora.",
    descAr: 'الإطار التعاقدي الذي ينظم استخدام خدمات التكوين والأكاديمية في Nexyvora.',
    defaultContentFr: `# Conditions Générales d'Utilisation et de Vente

Dernière mise à jour : 04 Octobre 2026

## 1. Préambule et Objet
La plateforme **Nexyvora** (ci-après « la Plateforme ») est une académie de formation professionnelle et d'apprentissage continu en ligne combinant l'enseignement de compétences d'avenir et un modèle communautaire de marketing de réseau. Les présentes Conditions Générales régissent l'accès, l'inscription et l'utilisation de l'ensemble des services, cours, modules interactifs et outils mis à disposition des membres.

## 2. Inscription et Éligibilité
- L'inscription est réservée aux personnes physiques âgées de 18 ans révolus ou disposant d'une autorisation parentale valide.
- L'utilisateur garantit l'exactitude, la véracité et la mise à jour de l'ensemble des informations fournies (identité, pays, coordonnées de contact WhatsApp, email).
- Chaque membre est seul responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée depuis son compte.

## 3. Accès aux Formations et Propriété Intellectuelle
- L'acquisition d'un pack ou d'une formation octroie une licence d'accès personnelle, non exclusive et incessible aux contenus pédagogiques.
- Tous les supports, vidéos, documents PDF, diapositives, code source et méthodes pédagogiques sont la propriété intellectuelle exclusive de Nexyvora et de ses formateurs agréés.
- Toute reproduction, diffusion publique, enregistrement ou revente non autorisée est strictement prohibée et expose son auteur à des poursuites judiciaires.

## 4. Engagements et Code de Conduite
Les membres s'engagent à :
- Adopter un comportement respectueux au sein de la communauté, des espaces de chat et des sessions en direct.
- Ne pas promouvoir d'activités illégales, de contenus diffamatoires ou de démarches commerciales non sollicitées (spam).
- Respecter scrupuleusement les règles déontologiques du marketing relationnel de la Société.

## 5. Résiliation et Suspension de Compte
Nexyvora se réserve le droit de suspendre temporairement ou de résilier définitivement l'accès d'un membre en cas de manquement grave aux présentes conditions, sans préavis ni indemnité.`,
    defaultContentAr: `# الشروط والأحكام العامة للاستخدام والخدمات

آخر تحديث: 04 أكتوبر 2026

## 1. الديباجة والهدف
تعتبر منصة **Nexyvora** (المشار إليها فيما بعد بـ "المنصة") أكاديمية تعليمية وتدريبية متطورة عبر الإنترنت تجمع بين تطوير المهارات المستقبلية ونموذج التسويق الشبكي المجتمعي المبتكر. تنظم هذه الشروط العامة شروط التسجيل، الوصول، والاستفادة من كافة البرامج والوحدات التكوينية والأدوات المتاحة للأعضاء.

## 2. التسجيل والأهلية
- يتاح التسجيل للأشخاص البالغين من العمر 18 عاماً فما فوق أو الحاصلين على تفويض قانوني معتمد.
- يلتزم المستخدم بتقديم معلومات صحيحة ودقيقة ومحدثة (الاسم، الدولة، رقم الواتساب، والبريد الإلكتروني).
- يتحمل كل عضو المسؤولية الكاملة عن سرية بيانات حسابه وكافة العمليات المنجزة عبره.

## 3. حقوق الملكية الفكرية للمحتوى
- يمنح الاشتراك في أي باقة أو برنامج تكويني ترخيصاً شخصياً وغير قابل للتحويل للوصول إلى المواد التعليمية.
- كافة الفيديوهات، العروض، ملفات PDF، والأدوات هي ملكية فكرية حصرية لأكاديمية Nexyvora ومدربيها المعتمدين.
- يمنع منعاً باتاً تسجيل أو إعادة بيع أو نشر أي محتوى دون موافقة كتابية صريحة.

## 4. ميثاق الالتزام وحسن السلوك
- احترام باقي أعضاء المجتمع والالتزام بآداب النقاش في غرف البث المباشر والدردشة.
- الامتناع التام عن الترويج لأي أنشطة غير قانونية أو ادعاءات مضللة.

## 5. تعليق أو إغلاق الحساب
تحتفظ إدارة المنصة بالحق في تعليق أو إلغاء عضوية أي مستخدم يخالف هذه البنود بصورة جسيمة.`
  },
  {
    id: 'company',
    slug: 'politique-societe',
    settingKey: 'policy_company_content',
    icon: Building2,
    titleFr: 'Politique de la Société',
    titleAr: 'سياسة الشركة وميثاق الشرف',
    titleEn: 'Company Policy & Code of Ethics',
    descFr: "Valeurs éthiques, règles de conduite professionnelle et gouvernance du réseau des affiliés.",
    descAr: 'القيم الأخلاقية، قواعد السلوك المهني ومعايير حوكمة شبكة المسوقين والشركاء.',
    defaultContentFr: `# Politique de la Société et Code d'Éthique Nexyvora

Dernière mise à jour : 04 Octobre 2026

## 1. Vision et Mission
Chez **Nexyvora**, notre mission est de démocratiser l'excellence éducative et de créer des passerelles concrètes vers l'indépendance financière. Nous valorisons l'intégrité, la transparence, le mentorat authentique et l'innovation continue.

## 2. Déontologie du Marketing de Réseau
Le modèle de recommandation et de marketing relationnel de Nexyvora repose sur la valeur réelle des formations dispensées :
- **Transparence absolue :** Aucun affilié ne doit garantir des revenus fixes, des rendements automatiques ou promettre un enrichissement passif sans travail ni apprentissage.
- **Vente de valeur :** Les commissions sont générées par la vente et l'accès effectif aux produits d'apprentissage de haute qualité.
- **Bienveillance et entraide :** Tout leader ou parrain a pour devoir d'accompagner, de former et de soutenir ses filleuls dans leur apprentissage.

## 3. Interdiction des Pratiques Déloyales
Sont formellement interdites les pratiques suivantes :
- Le débauchage agressif de membres appartenant à d'autres lignées au sein de Nexyvora (cross-sponsoring).
- La création de multiples comptes fictifs ou l'utilisation d'identités usurpées pour manipuler l'arbre généalogique.
- Toute communication publique portant atteinte à la réputation ou à l'image de marque de Nexyvora.

## 4. Sanctions Disciplinaires
Tout manquement aux règles de la Société donne lieu à un examen par le comité d'éthique, pouvant entraîner l'avertissement formel, le gel des commissions ou la radiation définitive du réseau.`,
    defaultContentAr: `# سياسة الشركة وميثاق السلوك المهني في Nexyvora

آخر تحديث: 04 أكتوبر 2026

## 1. الرؤية والرسالة
تتمثل رسالة **Nexyvora** في تمكين الشباب ورواد الأعمال من اكتساب مهارات احترافية نوعية وفتح آفاق حقيقية لبناء استقلال مالي مستدام، مستندين على الشفافية والابتكار ومساندة المجتمع.

## 2. ميثاق شرف التسويق الشبكي والمشاركة المجتمعية
- **الوضوح والصدق التام :** يُحظر على أي مسوق أو عضو تقديم وعود بأرباح خيالية أو دخل تلقائي دون بذل مجهود حقيقي في التعلم وبناء الفريق.
- **القيمة الحقيقية :** العمولات والمكافآت مستمدة من الاشتراك والاستفادة الفعلية من التكوينات والبرامج المعتمدة.
- **التأطير والمصاحبة :** يلتزم القادة بنقل المعرفة ومرافقة أعضاء فرقهم لضمان تطورهم المستمر.

## 3. الممارسات المحظورة
- منع الاستقطاب المزدوج غير النزيه بين الفرق داخل المنصة (Cross-Sponsoring).
- منع إنشاء حسابات وهمية للتلاعب بهيكل الأجيال والمكافآت.
- الحفاظ التام على سمعة الأكاديمية وصورتها المؤسسية.

## 4. الإجراءات التأديبية
تخضع أي مخالفة صريحة للتحقيق من قِبل لجنة الانضباط، وقد يترتب عليها تجميد المستحقات أو الإلغاء النهائي للعضوية.`
  },
  {
    id: 'aml',
    slug: 'anti-blanchiment',
    settingKey: 'policy_aml_content',
    icon: ShieldAlert,
    titleFr: 'Politique Anti-Blanchiment (AML)',
    titleAr: 'سياسة مكافحة غسيل الأموال (AML)',
    titleEn: 'Anti-Money Laundering (AML) Policy',
    descFr: "Procédures de conformité financière, vérification d'identité KYC et prévention des fraudes.",
    descAr: 'إجراءات الامتثال المالي، التحقق من الهوية (KYC) ومنع الاحتيال والأنشطة المالية المشبوهة.',
    defaultContentFr: `# Politique Anti-Blanchiment d'Argent (AML) & Conformité KYC

Dernière mise à jour : 04 Octobre 2026

## 1. Déclaration d'Engagement
Nexyvora applique une politique de tolérance zéro envers le blanchiment de capitaux, le financement d'activités illicites et les fraudes financières. Nous respectons rigoureusement les directives internationales et les meilleures pratiques du secteur.

## 2. Procédures de Vérification d'Identité (KYC)
- Tout membre souhaitant effectuer des retraits de commissions ou activer des seuils de transfert financiers doit obligatoirement compléter la vérification **KYC (Know Your Customer)**.
- Les documents requis incluent : pièce d'identité officielle en cours de validité (CNI, Passeport), justificatif de domicile récent et justificatif du moyen de réception des fonds.
- Nexyvora procède à la vérification croisée et se réserve le droit de rejeter tout dossier présentant des incohérences.

## 3. Surveillance des Flux Financiers
- Les dépôts et retraits doivent être effectués au nom du titulaire vérifié du compte.
- Les paiements ou demandes de retraits vers des tiers non identifiés sont systématiquement refusés.
- Tout mouvement inhabituel ou volume anormal de transactions fait l'objet d'un audit de sécurité interne.

## 4. Coopération avec les Autorités
En cas de soupçon avéré d'activité frauduleuse ou de tentative de blanchiment, Nexyvora gèlera immédiatement les fonds concernés et coopérera pleinement avec les autorités judiciaires et régulateurs compétents.`,
    defaultContentAr: `# سياسة مكافحة غسيل الأموال (AML) وإجراءات التحقق (KYC)

آخر تحديث: 04 أكتوبر 2026

## 1. التزام المنصة بالمعايير الدولية
تطبق **Nexyvora** معايير صارمة وخالية من أي تهاون لمنع استغلال المنصة في أي عمليات مشبوهة أو غسيل أموال، وذلك انسجاماً مع القوانين والتشريعات المالية الدولية.

## 2. إجراءات التحقق من الهوية (KYC)
- يُلزم كل عضو يرغب في سحب عمولاته أو تنفيذ عمليات مالية باجتياز مرحلة التحقق من الهوية بنجاح.
- تشمل الوثائق المطلوبة: بطاقة هوية وطنية أو جواز سفر ساري المفعول، وإثبات لوسيلة استلام الأموال.
- تُراجع الطلبات بدقة من قِبل فريق الامتثال المالي.

## 3. مراقبة العمليات والحسابات
- يجب أن تتطابق هوية صاحب الحساب تماماً مع بيانات الحساب البنكي أو المحفظة الرقمية المستخدمة.
- يُمنع تحويل أي أموال لحسابات أطراف ثالثة غير مسجلة.

## 4. الإبلاغ عن الأنشطة المشبوهة
تحتفظ إدارة الأكاديمية بحق تجميد الحسابات المشبوهة والتواصل مع السلطات الرسمية المختصة عند ثبوت أي مخالفة.`
  },
  {
    id: 'privacy',
    slug: 'confidentialite',
    settingKey: 'policy_privacy_content',
    icon: Lock,
    titleFr: 'Politique de Confidentialité',
    titleAr: 'سياسة الخصوصية وحماية البيانات',
    titleEn: 'Privacy Policy',
    descFr: "Protection des données personnelles, protocoles de chiffrement et respect de la vie privée.",
    descAr: 'حماية البيانات الشخصية للمستخدمين، بروتوكولات التشفير، وحقوق الخصوصية الرقمية.',
    defaultContentFr: `# Politique de Confidentialité et Protection des Données Personnelles

Dernière mise à jour : 04 Octobre 2026

## 1. Collecte des Données
Dans le cadre de votre parcours au sein de **Nexyvora**, nous collectons les données strictement nécessaires :
- **Données d'identification :** Nom complet, adresse email, numéro de téléphone WhatsApp, pays et ville de résidence.
- **Données pédagogiques :** Suivi de progression des modules, devoirs remis, présence aux réunions en direct, attestations obtenues.
- **Données financières :** Historique des dépôts, retraits et commissions (sans enregistrer vos coordonnées bancaires sensibles, traitées par des passerelles sécurisées).

## 2. Finalités du Traitement
Vos informations sont exploitées pour :
- Fournir et personnaliser l'accès aux cours et outils de formation.
- Assurer le calcul transparent des commissions et le versement des gains.
- Garantir le support technique et la communication importante via WhatsApp/Email.
- Améliorer en continu l'ergonomie et la sécurité de l'expérience utilisateur.

## 3. Sécurité et Chiffrement
- Vos communications sont sécurisées par un protocole de chiffrement SSL 256-bit de pointe.
- Les mots de passe sont hachés de manière irréversible via l'algorithme Bcrypt.
- Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins publicitaires.

## 4. Vos Droits (Accès, Rectification, Suppression)
Vous disposez à tout moment du droit de consulter, modifier ou demander la suppression de vos données personnelles en contactant notre délégué à la protection des données via la section Support.`,
    defaultContentAr: `# سياسة الخصوصية وحماية البيانات الشخصية

آخر تحديث: 04 أكتوبر 2026

## 1. البيانات التي نقوم بجمعها
نجمع في **Nexyvora** البيانات الضرورية لتوفير أفضل تجربة تعليمية ومالية ممكنة:
- **بيانات التعريف :** الاسم الكامل، البريد الإلكتروني، رقم الواتساب، الدولة والمدينة.
- **البيانات التعليمية :** سجل إكمال الدروس، المهام، وحضور المحاضرات المباشرة.
- **البيانات المالية :** سجل المعاملات والسحوبات المنجزة داخل المحفظة.

## 2. أوجه استخدام البيانات
- تفعيل وإدارة الحسابات والبرامج التكوينية.
- احتساب العمولات والمكافآت بدقة وتحويل المستحقات.
- تقديم الدعم الفني والإشعارات الضرورية عبر البريد أو الواتساب.

## 3. معايير الأمان والتشفير
- كافة الاتصالات والبيانات مشفرة بتقنية 256-bit SSL العالمية.
- كلمات المرور مشفرة بخوارزميات تجزئة معقدة ولا يمكن لأحد الاطلاع عليها.
- نلتزم التزاماً مطلقاً بعدم بيع أو مشاركة بياناتك مع أي طرف ثالث تجاري.

## 4. حقوقك القانونية
يحق لك في أي وقت مراجعة بياناتك، تعديلها، أو طلب حذف حسابك عبر التواصل مع إدارة الدعم.`
  },
  {
    id: 'payment',
    slug: 'moyens-paiement',
    settingKey: 'policy_payment_content',
    icon: CreditCard,
    titleFr: 'Moyens de Paiement',
    titleAr: 'طرق الدفع والعمليات المالية',
    titleEn: 'Payment Methods & Policies',
    descFr: "Modalités de règlement, passerelles sécurisées, délais de traitement et conditions de rétractation.",
    descAr: 'وسائل الدفع المعتمدة، البوابات الآمنة، فترات معالجة المعاملات وشروط الإلغاء والاسترجاع.',
    defaultContentFr: `# Politique des Moyens de Paiement et Transactions Financières

Dernière mise à jour : 04 Octobre 2026

## 1. Canaux de Paiement Acceptés
Afin de faciliter l'accès mondial aux programmes de Nexyvora, nous acceptons plusieurs méthodes de paiement sécurisées :
- **Cartes bancaires internationales :** Visa, MasterCard via passerelles de paiement cryptées 3D-Secure.
- **Virements et transferts bancaires :** Comptes agréés dans les pays éligibles.
- **Crypto-actifs (USDT TRC-20 / BEP-20) :** Transactions rapides et transparentes adaptées aux membres internationaux.
- **Portefeuille interne (Wallet) :** Utilisation du solde de commissions disponibles pour activer des packs ou inscrire de nouveaux membres.

## 2. Sécurisation des Paiements
- Toutes les transactions en ligne sont traitées via des protocoles sécurisés SSL conformes aux normes PCI-DSS.
- Nexyvora ne stocke aucun numéro complet de carte bancaire sur ses serveurs.

## 3. Validation des Dépôts et Délais de Retrait
- Les dépôts par carte ou crypto sont crédités de manière quasi instantanée ou après confirmation blockchain.
- Les dépôts manuels par virement sont validés sous 24h ouvrées après vérification du reçu.
- Les demandes de retrait de commissions sont soumises à vérification KYC et traitées dans les délais annoncés (habituellement sous 24h à 48h ouvrées).

## 4. Politique de Rétractation et Remboursement
- En raison de la nature numérique des contenus et de l'accès instantané aux ressources et formations, tout achat est réputé ferme et définitif dès lors que l'accès aux cours a été débloqué.
- Des réclamations exceptionnelles peuvent être soumises au support dans un délai de 7 jours suivant l'adhésion si aucun contenu n'a été consommé.`,
    defaultContentAr: `# سياسة وسائل الدفع والمعاملات المالية

آخر تحديث: 04 أكتوبر 2026

## 1. وسائل الدفع المعتمدة
لتسهيل اشتراك الأعضاء من مختلف أنحاء العالم، تدعم **Nexyvora** قنوات دفع متعددة ومؤمنة:
- **البطاقات البنكية الدولية :** Visa و MasterCard عبر بروتوكولات الأمان والحماية 3D-Secure.
- **التحويلات البنكية المحلية والدولية :** عبر حسابات المنصة المعتمدة.
- **العملات الرقمية (USDT TRC-20 / BEP-20) :** سرعة ومرونة عالية في الدفع لجميع الدول.
- **المحفظة الداخلية (Wallet) :** تفعيل الباقات وتسجيل الأعضاء باستخدام رصيد العمولات المتوفر.

## 2. معايير أمان العمليات
- كافة الدفعات تخضع لمعايير التشفير المالي المتوافقة مع بروتوكولات PCI-DSS.
- لا تحتفظ المنصة ببيانات بطاقتك البنكية الحساسة على خوادمها.

## 3. سرعة معالجة الإيداعات والسحوبات
- يتم تأكيد الإيداعات التلقائية بصورة فورية.
- تُعالج الإيداعات اليدوية خلال 24 ساعة كحد أقصى بعد رفع الوصل.
- تخضع طلبات السحب لتدقيق الأمان المالي وتتم معالجتها في غضون 24 إلى 48 ساعة عمل.

## 4. سياسة الإلغاء والاسترجاع
- نظراً للطبيعة الرقمية للمحتوى التعليمي وإمكانية الولوج الفوري لكافة الدروس والأدوات، يُعتبر الاشتراك نهائياً فور الاستفادة من المحتوى.
- يمكن تقديم طلبات استثنائية لفريق الدعم خلال 7 أيام من تاريخ الدفع شريطة عدم تصفح الوحدات التعليمية.`
  }
];

export default function AdminPolicies() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: settingsData, isLoading } = usePlatformSettings();
  const updateSetting = useUpdatePlatformSetting();

  const [activePolicyId, setActivePolicyId] = useState<string>('terms');
  const [activeLang, setActiveLang] = useState<'fr' | 'ar'>('fr');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [policyForms, setPolicyForms] = useState<Record<string, { fr: string; ar: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const activePolicy = DEFAULT_POLICIES.find(p => p.id === activePolicyId) || DEFAULT_POLICIES[0];

  // Initialize state from platform settings or defaults
  useEffect(() => {
    if (settingsData?.map) {
      const initial: Record<string, { fr: string; ar: string }> = {};
      DEFAULT_POLICIES.forEach(p => {
        const frVal = settingsData.map[`${p.settingKey}_fr`]?.value || settingsData.map[p.settingKey]?.value || p.defaultContentFr;
        const arVal = settingsData.map[`${p.settingKey}_ar`]?.value || p.defaultContentAr;
        initial[p.id] = { fr: frVal, ar: arVal };
      });
      setPolicyForms(initial);
    } else {
      const initial: Record<string, { fr: string; ar: string }> = {};
      DEFAULT_POLICIES.forEach(p => {
        initial[p.id] = { fr: p.defaultContentFr, ar: p.defaultContentAr };
      });
      setPolicyForms(initial);
    }
  }, [settingsData]);

  const handleContentChange = (val: string) => {
    setPolicyForms(prev => ({
      ...prev,
      [activePolicyId]: {
        ...prev[activePolicyId],
        [activeLang]: val
      }
    }));
  };

  const handleResetToDefault = () => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من استعادة النموذج الافتراضي لهذه السياسة؟' : 'Voulez-vous vraiment réinitialiser cette politique au modèle par défaut ?')) {
      return;
    }
    setPolicyForms(prev => ({
      ...prev,
      [activePolicyId]: {
        ...prev[activePolicyId],
        [activeLang]: activeLang === 'fr' ? activePolicy.defaultContentFr : activePolicy.defaultContentAr
      }
    }));
    toast.info(isRtl ? 'تمت استعادة النص الافتراضي' : 'Modèle par défaut restauré');
  };

  const handleSavePolicy = async () => {
    setIsSaving(true);
    try {
      const current = policyForms[activePolicyId];
      if (!current) return;

      // Save both FR and AR versions, plus the main key
      await Promise.all([
        updateSetting.mutateAsync({
          key: `${activePolicy.settingKey}_fr`,
          value: current.fr
        }),
        updateSetting.mutateAsync({
          key: `${activePolicy.settingKey}_ar`,
          value: current.ar
        }),
        // Also save primary key for fallback compatibility
        updateSetting.mutateAsync({
          key: activePolicy.settingKey,
          value: current.fr
        }),
        // Update last updated timestamp
        updateSetting.mutateAsync({
          key: `${activePolicy.settingKey}_updated_at`,
          value: new Date().toISOString()
        })
      ]);

      toast.success(isRtl ? 'تم حفظ السياسة وتحديثها بنجاح!' : 'Politique enregistrée et mise à jour avec succès !');
    } catch (err: any) {
      toast.error(isRtl ? `فشل الحفظ: ${err.message}` : `Erreur lors de l'enregistrement: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const currentContent = policyForms[activePolicyId]?.[activeLang] ?? '';

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isRtl ? 'الامتثال والشروط القانونية' : 'Conformité & Légal'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isRtl ? 'إدارة الدعم والسياسات' : 'Support & Politiques'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl 
                ? 'تعديل وتخصيص سياسات الخصوصية، الشروط العامة، مكافحة غسيل الأموال ووسائل الدفع للمنصة.'
                : 'Personnalisez et mettez à jour les politiques de confidentialité, conditions générales, AML et moyens de paiement.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Public Page */}
            <a
              href={`/policies/${activePolicy.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>{isRtl ? 'معاينة الواجهة العامة' : 'Aperçu public'}</span>
            </a>

            {/* Save Button */}
            <Button
              onClick={handleSavePolicy}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Enregistrement...') : (isRtl ? 'حفظ السياسة' : 'Enregistrer')}</span>
            </Button>
          </div>
        </div>

        {/* 2-Columns Layout: Policies Navigation on Left, Editor on Right */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Policies Selection Cards (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-1">
                {isRtl ? 'قائمة السياسات (5)' : 'Liste des politiques (5)'}
              </p>
              
              <div className="mt-2 space-y-2">
                {DEFAULT_POLICIES.map((policy) => {
                  const isSelected = activePolicyId === policy.id;
                  const Icon = policy.icon;

                  return (
                    <button
                      key={policy.id}
                      type="button"
                      onClick={() => setActivePolicyId(policy.id)}
                      className={`w-full text-left rtl:text-right p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-md shadow-indigo-500/10 text-slate-900 dark:text-white ring-1 ring-indigo-500'
                          : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs sm:text-sm font-bold truncate">
                            {isRtl ? policy.titleAr : policy.titleFr}
                          </p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/40 shrink-0">
                            {isRtl ? 'مفعل' : 'Actif'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {isRtl ? policy.descAr : policy.descFr}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro Helper Tip */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isRtl
                  ? 'التعديلات المحفوظة هنا تنعكس فورياً في الروابط العامة بالفوتر وفي صفحات التسجيل وتوثيق الحساب.'
                  : 'Les modifications enregistrées ici sont immédiatement visibles publiquement dans le footer et lors des inscriptions.'}
              </p>
            </div>
          </div>

          {/* Right Side: Active Policy Editor (8 cols) */}
          <div className="lg:col-span-8">
            <Card className="rounded-3xl border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-100 dark:shadow-black/50 overflow-hidden">
              
              {/* Card Header with Lang Switcher & Mode Toggles */}
              <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                      <activePolicy.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                        {isRtl ? activePolicy.titleAr : activePolicy.titleFr}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        Slug: <code className="font-mono text-indigo-600 dark:text-indigo-400">/policies/{activePolicy.slug}</code>
                      </CardDescription>
                    </div>
                  </div>

                  {/* Controls: Language tabs (FR / AR) and Mode tabs (Edit / Preview) */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Language Switcher */}
                    <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setActiveLang('fr')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeLang === 'fr' 
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🇫🇷 Français
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLang('ar')}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          activeLang === 'ar' 
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🇲🇦 العربية
                      </button>
                    </div>

                    {/* Edit / Preview Toggle */}
                    <div className="flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300/40 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setEditorMode('edit')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          editorMode === 'edit'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Mode Édition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditorMode('preview')}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          editorMode === 'preview'
                            ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Aperçu du rendu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Reset Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetToDefault}
                      className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1.5 rounded-xl h-8 px-2.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isRtl ? 'استعادة الافتراضي' : 'Modèle'}</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Editor / Preview Content Body */}
              <CardContent className="p-5 sm:p-6 space-y-4">
                
                {editorMode === 'edit' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <Label htmlFor="policy-content" className="font-semibold text-slate-700 dark:text-slate-300">
                        {isRtl ? 'محتوى السياسة (يدعم تنسيق Markdown)' : 'Contenu légal (Format Markdown supporté)'}
                      </Label>
                      <span className="text-[11px] font-mono text-slate-400">
                        {currentContent.length} caractères
                      </span>
                    </div>

                    <Textarea
                      id="policy-content"
                      value={currentContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      rows={22}
                      placeholder={isRtl ? 'اكتب بنود السياسة هنا...' : 'Rédigez le texte de la politique ici...'}
                      className="font-mono text-xs sm:text-sm bg-slate-950/5 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 rounded-2xl p-4 leading-relaxed focus:ring-2 focus:ring-indigo-500 transition-all resize-y"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl p-6 bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 max-h-[550px] overflow-y-auto prose dark:prose-invert prose-sm max-w-none">
                    <div className="whitespace-pre-wrap leading-relaxed text-sm text-slate-800 dark:text-slate-200 font-sans">
                      {currentContent}
                    </div>
                  </div>
                )}

                {/* Footer status & Save button */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isRtl ? 'الحفظ يتم في قاعدة بيانات المنصة' : 'Enregistrement direct dans la base de données'}
                    </span>
                  </div>

                  <Button
                    onClick={handleSavePolicy}
                    disabled={isSaving}
                    className="px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? (isRtl ? 'جاري الحفظ...' : 'Enregistrement...') : (isRtl ? 'حفظ التعديلات' : 'Enregistrer')}</span>
                  </Button>
                </div>

              </CardContent>

            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
