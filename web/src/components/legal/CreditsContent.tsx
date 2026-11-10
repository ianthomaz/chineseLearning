"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";

type CreditItem = {
  name: string;
  author: string;
  role: { pt: string; en: string; es: string };
  license: string;
  licenseUrl: string;
  repoUrl: string;
};

const STROKE_CREDITS: CreditItem[] = [
  {
    name: "Hanzi Writer",
    author: "C. Lindsay (Chanind)",
    role: {
      pt: "Motor vetorial JavaScript/HTML5 para renderização e animação da escrita de caracteres chineses.",
      en: "Vector JavaScript/HTML5 engine for rendering and animating Chinese character stroke order.",
      es: "Motor vectorial JavaScript/HTML5 para renderizado y animación de trazos de caracteres chinos.",
    },
    license: "MIT License",
    licenseUrl: "https://opensource.org/licenses/MIT",
    repoUrl: "https://github.com/chanind/hanzi-writer",
  },
  {
    name: "hanzi-writer-data",
    author: "C. Lindsay (Chanind)",
    role: {
      pt: "Dados estruturados de coordenadas e sequenciamento de traços para caracteres chineses.",
      en: "Structured stroke coordinate and ordering data for Chinese characters.",
      es: "Datos estructurados de coordenadas y orden de trazos para caracteres chinos.",
    },
    license: "MIT License",
    licenseUrl: "https://opensource.org/licenses/MIT",
    repoUrl: "https://github.com/chanind/hanzi-writer-data",
  },
  {
    name: "Make Me a Hanzi",
    author: "Shaunak Kishore",
    role: {
      pt: "Banco de dados aberto de traços caligráficos extraídos e normalizados para ideogramas simplificados.",
      en: "Open database of extracted and normalized calligraphic stroke data for simplified ideograms.",
      es: "Base de datos abierta de trazos caligráficos extraídos y normalizados para ideogramas simplificados.",
    },
    license: "MIT / Arphic Public License",
    licenseUrl: "https://github.com/skishore/makemeahanzi/blob/master/COPYING.md",
    repoUrl: "https://github.com/skishore/makemeahanzi",
  },
  {
    name: "Arphic PL KaitiM GB & UKai",
    author: "© 1999 Arphic Technology Co., Ltd. & © 2016 Shaunak Kishore",
    role: {
      pt: "Esqueletos caligráficos e contornos vetoriais que formam a base dos traços dos caracteres.",
      en: "Calligraphic outlines and stroke skeletons serving as the foundation of character animations.",
      es: "Esqueletos caligráficos y contornos vectoriales que forman la base de los trazos de los caracteres.",
    },
    license: "Arphic Public License",
    licenseUrl: "https://www.gnu.org/licenses/license-list.html#Arphic",
    repoUrl: "http://www.arphic.com.tw",
  },
];

const TYPO_CREDITS: CreditItem[] = [
  {
    name: "Noto Sans SC",
    author: "Google LLC",
    role: {
      pt: "Família tipográfica limpa de alta legibilidade para caracteres chineses simplificados na interface.",
      en: "Clean, highly legible typeface family for simplified Chinese characters in interface elements.",
      es: "Familia tipográfica limpia de alta legibilidad para caracteres chinos simplificados en la interfaz.",
    },
    license: "SIL Open Font License 1.1",
    licenseUrl: "https://openfontlicense.org",
    repoUrl: "https://fonts.google.com/noto/specimen/Noto+Sans+SC",
  },
  {
    name: "Hanzi Pinyin Font",
    author: "parlr (GitHub)",
    role: {
      pt: "Tipografia aberta com anotação fonética pinyin alinhada diretamente sobre os ideogramas.",
      en: "Open typeface featuring tone-annotated pinyin displayed above corresponding ideograms.",
      es: "Tipografía abierta con anotación fonética pinyin alineada directamente sobre los ideogramas.",
    },
    license: "SIL Open Font License 1.1 / Open Font",
    licenseUrl: "https://github.com/parlr/hanzi-pinyin-font/blob/master/LICENSE",
    repoUrl: "https://github.com/parlr/hanzi-pinyin-font",
  },
];

const CONTENT_CREDITS: CreditItem[] = [
  {
    name: "Curadoria Didática de Frases e Vocabulário HSK",
    author: "LearnChinese Today / Ian Thomaz",
    role: {
      pt: "Composição original, explicações gramaticais e seleção de vocabulário HSK 1 a 3 para prática ativa.",
      en: "Original sentence composition, grammatical notes, and HSK 1–3 vocabulary curation for active practice.",
      es: "Composición original de frases, notas gramaticales y selección de vocabulario HSK 1 a 3 para práctica activa.",
    },
    license: "CC BY-SA 4.0 (Atribuição-CompartilhaIgual)",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    repoUrl: "https://learnchinese.today",
  },
];

const SDK_CREDITS: CreditItem[] = [
  {
    name: "Google Sign-In iOS SDK",
    author: "Google LLC",
    role: {
      pt: "Biblioteca para autenticação federada com Google no aplicativo móvel iOS e na web.",
      en: "Federated authentication library for Google Sign-In across iOS and web.",
      es: "Biblioteca para autenticación federada con Google en la app móvil iOS y la web.",
    },
    license: "Apache License 2.0",
    licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
    repoUrl: "https://github.com/google/GoogleSignIn-iOS",
  },
  {
    name: "Firebase Analytics & Crashlytics",
    author: "Google LLC",
    role: {
      pt: "Diagnóstico técnico anônimo de estabilidade e prevenção de falhas de execução no aplicativo móvel.",
      en: "Anonymous technical diagnostics for crash prevention and app stability on iOS.",
      es: "Diagnóstico técnico anónimo de estabilidad y prevención de fallos en la app móvil.",
    },
    license: "Apache License 2.0",
    licenseUrl: "https://www.apache.org/licenses/LICENSE-2.0",
    repoUrl: "https://github.com/firebase/firebase-ios-sdk",
  },
  {
    name: "AlipaySDK",
    author: "Ant Group Co., Ltd.",
    role: {
      pt: "Autenticação via Alipay para estudantes da comunidade chinesa e internacional.",
      en: "Secure Alipay sign-in integration for international and Chinese-speaking learners.",
      es: "Autenticación segura con Alipay para estudiantes de la comunidad internacional y china.",
    },
    license: "Alipay Open Platform Terms",
    licenseUrl: "https://opendocs.alipay.com/open/204/105295",
    repoUrl: "https://opendocs.alipay.com/open/204/105295",
  },
];

function CreditCard({ item, lang }: { item: CreditItem; lang: "pt" | "en" | "es" }) {
  return (
    <div
      className="flex flex-col justify-between rounded-xl border p-5 transition-shadow hover:shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface, var(--paper))",
      }}
    >
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-semibold text-ink text-base">
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-accent underline decoration-ink/20 underline-offset-2 transition-colors"
            >
              {item.name}
            </a>
          </h3>
          <a
            href={item.licenseUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full px-2.5 py-0.5 text-xs font-medium border text-accent/90"
            style={{ borderColor: "var(--border)" }}
          >
            {item.license}
          </a>
        </div>
        <p className="mt-1 text-xs text-ink/50 font-medium">
          {item.author}
        </p>
        <p className="mt-3 text-sm text-ink/80 leading-relaxed">
          {item.role[lang]}
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-ink/60">
        <a
          href={item.repoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline flex items-center gap-1 font-medium"
        >
          {lang === "pt" ? "Repositório Oficial ↗" : lang === "es" ? "Repositorio Oficial ↗" : "Official Repository ↗"}
        </a>
        <a
          href={item.licenseUrl}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          {lang === "pt" ? "Ver Licença" : lang === "es" ? "Ver Licencia" : "View License"}
        </a>
      </div>
    </div>
  );
}

export function CreditsContent() {
  const { locale, t } = useLocale();
  const lang = locale === "pt" || locale === "es" ? locale : "en";

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10 pb-[max(3rem,env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-14">
      <header className="mb-8 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <p
          className="mb-2 text-xs font-medium uppercase tracking-widest text-ink/45"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          learnchinese.today
        </p>
        <h1 className="font-display text-2xl font-medium text-ink sm:text-3xl">
          {t("legal.creditsTitle")}
        </h1>
        <p className="mt-2 text-xs text-ink/50">
          ITCS Webplace Ltda. · CNPJ: 65.998.990/0001-44
        </p>
      </header>

      {/* Agradecimento Institucional */}
      <section className="mb-10 rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--paper)" }}>
        <h2 className="text-lg font-semibold text-ink">
          {lang === "pt"
            ? "Reconhecimento às Comunidades de Software Livre e Recursos Abertos"
            : lang === "es"
            ? "Reconocimiento a las Comunidades de Software Libre y Recursos Abiertos"
            : "Gratitude to Open Source and Open Educational Communities"}
        </h2>
        <p className="mt-3 text-sm text-ink/80 leading-relaxed">
          {lang === "pt"
            ? "O LearnChinese Today reconhece e agradece profundamente aos pesquisadores, desenvolvedores, linguistas e mantenedores de projetos de código aberto e dados livres. Grande parte do nosso ecossistema educacional (site, aplicativo iOS e Widget) só existe graças à generosidade e ao rigor técnico dessas iniciativas. Abaixo listamos os componentes integrados, autores originais e respectivas licenças públicas."
            : lang === "es"
            ? "LearnChinese Today reconoce y agradece profundamente a los investigadores, desarrolladores, lingüistas y mantenedores de proyectos de código abierto y datos libres. Gran parte de nuestro ecosistema educativo (web, aplicación iOS y Widget) existe gracias a la generosidad y rigor técnico de estas iniciativas. A continuación se listan los componentes integrados, autores originales y licencias públicas."
            : "LearnChinese Today deeply recognizes and thanks the researchers, developers, linguists, and open data maintainers whose generosity and technical rigor make this educational service possible across web, iOS, and widgets. Below are the integrated open-source components, original authors, and applicable public licenses."}
        </p>
        <div className="mt-4 rounded-lg bg-surface/60 p-3 text-xs text-ink/65 border border-border/40">
          <strong>
            {lang === "pt" ? "Nota de Independência HSK:" : lang === "es" ? "Nota de Independencia HSK:" : "HSK Independence Notice:"}
          </strong>{" "}
          {lang === "pt"
            ? "O LearnChinese Today é uma iniciativa educacional independente. As referências ao HSK e a níveis de proficiência são utilizadas exclusivamente com finalidade de orientação pedagógica e não representam vínculo formal, patrocínio ou endosso das entidades responsáveis pelos exames oficiais (Hanban / CTI)."
            : lang === "es"
            ? "LearnChinese Today es una iniciativa educativa independiente. Las referencias al HSK y niveles de competencia se utilizan exclusivamente como orientación pedagógica y no representan vínculo formal, patrocinio o respaldo de los organismos oficiales de exámenes (Hanban / CTI)."
            : "LearnChinese Today is an independent educational initiative. References to HSK and proficiency levels serve solely as pedagogical guidance and do not imply official affiliation, endorsement, or certification by official exam bodies (Hanban / CTI)."}
        </div>
      </section>

      {/* 1. Caligrafia e Ordem dos Traços */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-ink/60">
          {lang === "pt" ? "1. Caligrafia e Ordem dos Traços" : lang === "es" ? "1. Caligrafía y Orden de Trazos" : "1. Stroke Order & Handwriting"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {STROKE_CREDITS.map((item) => (
            <CreditCard key={item.name} item={item} lang={lang} />
          ))}
        </div>
      </section>

      {/* 2. Tipografia e Fonética */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-ink/60">
          {lang === "pt" ? "2. Tipografia e Fonética Pinyin" : lang === "es" ? "2. Tipografía y Fonética Pinyin" : "2. Typography & Pinyin Fonts"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {TYPO_CREDITS.map((item) => (
            <CreditCard key={item.name} item={item} lang={lang} />
          ))}
        </div>
      </section>

      {/* 3. Conteúdo Didático e Curadoria */}
      <section className="mb-10">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-ink/60">
          {lang === "pt" ? "3. Conteúdo Educacional e Curadoria" : lang === "es" ? "3. Contenido Educativo y Curaduría" : "3. Educational Content & Curated Decks"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-1">
          {CONTENT_CREDITS.map((item) => (
            <CreditCard key={item.name} item={item} lang={lang} />
          ))}
        </div>
      </section>

      {/* 4. Bibliotecas de Integração e SDKs */}
      <section className="mb-12">
        <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-ink/60">
          {lang === "pt" ? "4. Bibliotecas de Integração e Diagnóstico" : lang === "es" ? "4. Bibliotecas de Integración y Diagnóstico" : "4. Integration Libraries & Diagnostics"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {SDK_CREDITS.map((item) => (
            <CreditCard key={item.name} item={item} lang={lang} />
          ))}
        </div>
      </section>

      {/* Links de Rodapé */}
      <footer className="pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-sm text-ink/60">
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-accent underline underline-offset-2">
            {t("legal.termsLink")}
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-accent underline underline-offset-2">
            {t("legal.privacyLink")}
          </Link>
        </div>
        <p className="text-xs text-ink/40">
          © {new Date().getFullYear()} ITCS Webplace Ltda.
        </p>
      </footer>
    </article>
  );
}
