/**
 * Generates web/src/data/global-dialogues-extra.json
 * Run: node web/scripts/emit-global-dialogues-extra.mjs
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, "../src/data/global-dialogues-extra.json");

const T = (pt, en, es) => ({ pt, en, es });
const L = (speaker, hanzi, pinyin, pt, en, es) => ({
  speaker,
  hanzi,
  pinyin,
  translation: T(pt, en, es),
});

const sections = [
  // Block 1 — numbers
  {
    id: "numbersPhone",
    categoryId: 1,
    lines: [
      L("A", "你的电话是多少？", "Nǐ de diànhuà shì duōshǎo?", "Qual é o teu número de telefone?", "What is your phone number?", "¿Cuál es tu teléfono?"),
      L("B", "我的电话是一三八零零一二三四五。", "Wǒ de diànhuà shì yī sān bā líng líng yī èr sān sì wǔ.", "O meu número é 1380012345.", "My number is 1380012345.", "Mi número es 1380012345."),
      L("A", "谢谢，我记一下。", "Xièxie, wǒ jì yīxià.", "Obrigado, vou anotar.", "Thanks, I'll write it down.", "Gracias, lo apunto."),
    ],
  },
  {
    id: "numbersPrice",
    categoryId: 1,
    lines: [
      L("A", "这个多少钱？", "Zhège duōshao qián?", "Quanto custa isto?", "How much is this?", "¿Cuánto cuesta esto?"),
      L("B", "二十五块。", "Èrshíwǔ kuài.", "Vinte e cinco yuan.", "Twenty-five yuan.", "Veinticinco yuan."),
      L("A", "太贵了，二十块可以吗？", "Tài guì le, èrshí kuài kěyǐ ma?", "Muito caro, vinte yuan serve?", "Too expensive, is twenty okay?", "Muy caro, ¿veinte vale?"),
      L("B", "好吧。", "Hǎo ba.", "Está bem.", "Okay.", "Vale."),
    ],
  },
  {
    id: "numbersAge",
    categoryId: 1,
    lines: [
      L("A", "你今年多大？", "Nǐ jīnnián duō dà?", "Quantos anos tens este ano?", "How old are you this year?", "¿Cuántos años tienes este año?"),
      L("B", "我今年二十二岁。你呢？", "Wǒ jīnnián èrshí'èr suì. Nǐ ne?", "Tenho vinte e dois. E tu?", "I'm twenty-two. And you?", "Tengo veintidós. ¿Y tú?"),
      L("A", "我二十一岁。", "Wǒ èrshíyī suì.", "Tenho vinte e um.", "I'm twenty-one.", "Tengo veintiuno."),
    ],
  },
  // Block 2 — time / money (+1)
  {
    id: "cafeBill",
    categoryId: 2,
    lines: [
      L("A", "服务员，买单！", "Fúwùyuán, mǎidān!", "Empregado, a conta por favor!", "Waiter, the check please!", "¡Camarero, la cuenta!"),
      L("B", "一共三十五块。", "Yīgòng sānshíwǔ kuài.", "São trinta e cinco yuan no total.", "Thirty-five yuan in total.", "Treinta y cinco yuan en total."),
      L("A", "给你四十块，不用找了。", "Gěi nǐ sìshí kuài, bùyòng zhǎo le.", "Aqui tens quarenta, fica o troco.", "Here's forty, keep the change.", "Te doy cuarenta, quédate con el cambio."),
    ],
  },
  // Block 5 — countries / languages
  {
    id: "nationalityIntro",
    categoryId: 5,
    lines: [
      L("A", "你是哪国人？", "Nǐ shì nǎ guó rén?", "De que país és?", "What nationality are you?", "¿De qué país eres?"),
      L("B", "我是巴西人。", "Wǒ shì Bāxī rén.", "Sou brasileiro.", "I'm Brazilian.", "Soy brasileño."),
      L("A", "欢迎来中国！", "Huānyíng lái Zhōngguó!", "Bem-vindo à China!", "Welcome to China!", "¡Bienvenido a China!"),
    ],
  },
  {
    id: "languageSpeak",
    categoryId: 5,
    lines: [
      L("A", "你会说英语吗？", "Nǐ huì shuō Yīngyǔ ma?", "Sabes falar inglês?", "Do you speak English?", "¿Hablas inglés?"),
      L("B", "会一点儿。", "Huì yīdiǎnr.", "Um bocadinho.", "A little.", "Un poquito."),
      L("A", "那我们可以用英语聊。", "Nà wǒmen kěyǐ yòng Yīngyǔ liáo.", "Então podemos falar em inglês.", "Then we can chat in English.", "Entonces podemos hablar en inglés."),
    ],
  },
  {
    id: "whereFrom",
    categoryId: 5,
    lines: [
      L("A", "你从哪儿来？", "Nǐ cóng nǎr lái?", "De onde vens?", "Where are you from?", "¿De dónde vienes?"),
      L("B", "我从葡萄牙来。", "Wǒ cóng Pútáoyá lái.", "Venho de Portugal.", "I'm from Portugal.", "Vengo de Portugal."),
      L("A", "里斯本很漂亮吧？", "Lísīběn hěn piàoliang ba?", "Lisboa é bonita, não é?", "Lisbon is beautiful, right?", "Lisboa es bonita, ¿no?"),
      L("B", "对，很美。", "Duì, hěn měi.", "Sim, muito bonita.", "Yes, very beautiful.", "Sí, muy bonita."),
    ],
  },
  // Block 6 — colors
  {
    id: "colorsClothes",
    categoryId: 6,
    lines: [
      L("A", "你喜欢什么颜色？", "Nǐ xǐhuān shénme yánsè?", "Que cor gostas?", "What color do you like?", "¿Qué color te gusta?"),
      L("B", "我喜欢蓝色。", "Wǒ xǐhuān lánsè.", "Gosto de azul.", "I like blue.", "Me gusta el azul."),
      L("A", "这件红衬衫怎么样？", "Zhè jiàn hóng chènshān zěnmeyàng?", "Que achas desta camisa vermelha?", "How about this red shirt?", "¿Qué tal esta camisa roja?"),
      L("B", "很好看！", "Hěn hǎokàn!", "Muito gira!", "Looks great!", "¡Queda genial!"),
    ],
  },
  {
    id: "colorsLike",
    categoryId: 6,
    lines: [
      L("A", "你的包是黑色的吗？", "Nǐ de bāo shì hēisè de ma?", "A tua mala é preta?", "Is your bag black?", "¿Tu bolso es negro?"),
      L("B", "不是，是绿色的。", "Bù shì, shì lǜsè de.", "Não, é verde.", "No, it's green.", "No, es verde."),
      L("A", "绿色很漂亮。", "Lǜsè hěn piàoliang.", "O verde é bonito.", "Green is pretty.", "El verde es bonito."),
    ],
  },
  {
    id: "colorsWhich",
    categoryId: 6,
    lines: [
      L("A", "你要白色的还是黄色的？", "Nǐ yào báisè de háishì huángsè de?", "Queres branco ou amarelo?", "Do you want white or yellow?", "¿Quieres blanco o amarillo?"),
      L("B", "我要白色的。", "Wǒ yào báisè de.", "Quero branco.", "I'll take white.", "Quiero blanco."),
      L("A", "好的，给你。", "Hǎo de, gěi nǐ.", "Ok, aqui tens.", "Okay, here you go.", "Vale, toma."),
    ],
  },
  // Block 7 — family (+2)
  {
    id: "meetingColleague",
    categoryId: 7,
    lines: [
      L("A", "这是我妈妈。", "Zhè shì wǒ māma.", "Esta é a minha mãe.", "This is my mom.", "Esta es mi madre."),
      L("B", "阿姨，您好！", "Āyí, nín hǎo!", "Tia, olá! (respeitoso)", "Auntie, hello! (polite)", "¡Tía, buenos días! (respetuoso)"),
      L("C", "你好，请坐。", "Nǐ hǎo, qǐng zuò.", "Olá, senta-te.", "Hello, please sit.", "Hola, siéntate."),
    ],
  },
  {
    id: "familyPhoto",
    categoryId: 7,
    lines: [
      L("A", "照片上的人是你爸爸吗？", "Zhàopiàn shàng de rén shì nǐ bàba ma?", "Na foto é o teu pai?", "Is the person in the photo your dad?", "¿En la foto está tu padre?"),
      L("B", "对，那是我爸爸和我妹妹。", "Duì, nà shì wǒ bàba hé wǒ mèimei.", "Sim, é o meu pai e a minha irmã mais nova.", "Yes, that's my dad and my younger sister.", "Sí, es mi padre y mi hermana menor."),
      L("A", "你妹妹很可爱。", "Nǐ mèimei hěn kě'ài.", "A tua irmã é querida.", "Your sister is cute.", "Tu hermana es mona."),
    ],
  },
  // Block 9 — 是
  {
    id: "shIdentity",
    categoryId: 9,
    lines: [
      L("A", "他是谁？", "Tā shì shéi?", "Quem é ele?", "Who is he?", "¿Quién es él?"),
      L("B", "他是我的老师。", "Tā shì wǒ de lǎoshī.", "É o meu professor.", "He's my teacher.", "Es mi profesor."),
      L("A", "中文老师吗？", "Zhōngwén lǎoshī ma?", "Professor de chinês?", "Chinese teacher?", "¿Profesor de chino?"),
      L("B", "对，他是中文老师。", "Duì, tā shì Zhōngwén lǎoshī.", "Sim, é professor de chinês.", "Yes, he's a Chinese teacher.", "Sí, es profesor de chino."),
    ],
  },
  {
    id: "shProfession",
    categoryId: 9,
    lines: [
      L("A", "你是学生吗？", "Nǐ shì xuéshēng ma?", "És estudante?", "Are you a student?", "¿Eres estudiante?"),
      L("B", "是，我是大学生。", "Shì, wǒ shì dàxuéshēng.", "Sim, sou universitário.", "Yes, I'm a university student.", "Sí, soy universitario."),
      L("A", "学什么专业？", "Xué shénme zhuānyè?", "Que curso?", "What's your major?", "¿Qué carrera?"),
      L("B", "我学经济。", "Wǒ xué jīngjì.", "Estudo economia.", "I study economics.", "Estudio economía."),
    ],
  },
  {
    id: "shNotDoctor",
    categoryId: 9,
    lines: [
      L("A", "你是医生吗？", "Nǐ shì yīshēng ma?", "És médico?", "Are you a doctor?", "¿Eres médico?"),
      L("B", "不是，我是护士。", "Bù shì, wǒ shì hùshi.", "Não, sou enfermeiro.", "No, I'm a nurse.", "No, soy enfermero."),
      L("A", "哦，明白了。", "Ò, míngbai le.", "Ah, entendi.", "Oh, I see.", "Ah, entiendo."),
    ],
  },
  // Block 10 — adverbs
  {
    id: "alsoWant",
    categoryId: 10,
    lines: [
      L("A", "我要一碗米饭。", "Wǒ yào yī wǎn mǐfàn.", "Quero uma tigela de arroz.", "I want a bowl of rice.", "Quiero un bol de arroz."),
      L("B", "我也要米饭。", "Wǒ yě yào mǐfàn.", "Eu também quero arroz.", "I want rice too.", "Yo también quiero arroz."),
      L("A", "好的，两碗米饭。", "Hǎo de, liǎng wǎn mǐfàn.", "Ok, duas tigelas.", "Okay, two bowls.", "Vale, dos boles."),
    ],
  },
  {
    id: "veryTired",
    categoryId: 10,
    lines: [
      L("A", "你今天很忙吗？", "Nǐ jīntiān hěn máng ma?", "Estás muito ocupado hoje?", "Are you very busy today?", "¿Estás muy ocupado hoy?"),
      L("B", "很忙，我很累。", "Hěn máng, wǒ hěn lèi.", "Muito, estou cansado.", "Very, I'm tired.", "Mucho, estoy cansado."),
      L("A", "那你早点休息。", "Nà nǐ zǎo diǎn xiūxi.", "Então descansa cedo.", "Then rest early.", "Entonces descansa pronto."),
    ],
  },
  {
    id: "stillHere",
    categoryId: 10,
    lines: [
      L("A", "他还在公司吗？", "Tā hái zài gōngsī ma?", "Ele ainda está na empresa?", "Is he still at the office?", "¿Todavía está en la oficina?"),
      L("B", "对，他还在工作。", "Duì, tā hái zài gōngzuò.", "Sim, ainda está a trabalhar.", "Yes, he's still working.", "Sí, todavía está trabajando."),
      L("A", "太辛苦了。", "Tài xīnkǔ le.", "Trabalha muito.", "That's tough.", "Qué duro."),
    ],
  },
  // Block 11 — verbs / daily
  {
    id: "wantRest",
    categoryId: 11,
    lines: [
      L("A", "你想喝茶还是喝咖啡？", "Nǐ xiǎng hē chá háishì hē kāfēi?", "Queres chá ou café?", "Want tea or coffee?", "¿Té o café?"),
      L("B", "我想喝水，谢谢。", "Wǒ xiǎng hē shuǐ, xièxie.", "Quero água, obrigado.", "I want water, thanks.", "Quiero agua, gracias."),
      L("A", "等一下，我去拿。", "Děng yīxià, wǒ qù ná.", "Espera, vou buscar.", "Wait, I'll get it.", "Espera, voy a traerla."),
    ],
  },
  {
    id: "canSwim",
    categoryId: 11,
    lines: [
      L("A", "你会游泳吗？", "Nǐ huì yóuyǒng ma?", "Sabes nadar?", "Can you swim?", "¿Sabes nadar?"),
      L("B", "会，我从小就学。", "Huì, wǒ cóngxiǎo jiù xué.", "Sim, aprendi desde pequeno.", "Yes, I learned as a kid.", "Sí, desde pequeño."),
      L("A", "那周末我们去游泳池吧。", "Nà zhōumò wǒmen qù yóuyǒngchí ba.", "Então no fim de semana vamos à piscina.", "Let's go to the pool this weekend.", "Vamos a la piscina el fin de semana."),
    ],
  },
  {
    id: "learnPiano",
    categoryId: 11,
    lines: [
      L("A", "你在学什么？", "Nǐ zài xué shénme?", "Estás a aprender o quê?", "What are you learning?", "¿Qué estás aprendiendo?"),
      L("B", "我在学弹钢琴。", "Wǒ zài xué tán gāngqín.", "Estou a aprender piano.", "I'm learning to play piano.", "Estoy aprendiendo piano."),
      L("A", "真厉害！", "Zhēn lìhai!", "Impressionante!", "That's impressive!", "¡Qué guay!"),
    ],
  },
  // Block 12 — preference
  {
    id: "preferCoffee",
    categoryId: 12,
    lines: [
      L("A", "你更喜欢茶还是咖啡？", "Nǐ gèng xǐhuān chá háishì kāfēi?", "Preferes chá ou café?", "Do you prefer tea or coffee?", "¿Prefieres té o café?"),
      L("B", "我更喜欢茶。", "Wǒ gèng xǐhuān chá.", "Prefiro chá.", "I prefer tea.", "Prefiero el té."),
      L("A", "我也是。", "Wǒ yě shì.", "Eu também.", "Me too.", "Yo también."),
    ],
  },
  {
    id: "likeDance",
    categoryId: 12,
    lines: [
      L("A", "你喜欢运动吗？", "Nǐ xǐhuān yùndòng ma?", "Gostas de desporto?", "Do you like sports?", "¿Te gusta el deporte?"),
      L("B", "喜欢，我喜欢跑步和跳舞。", "Xǐhuān, wǒ xǐhuān pǎobù hé tiàowǔ.", "Gosto, gosto de correr e dançar.", "Yes, I like running and dancing.", "Sí, me gusta correr y bailar."),
      L("A", "跳舞很有意思。", "Tiàowǔ hěn yǒu yìsi.", "Dançar é divertido.", "Dancing is fun.", "Bailar es divertido."),
    ],
  },
  {
    id: "chooseMovie",
    categoryId: 12,
    lines: [
      L("A", "今晚看电影还是听音乐？", "Jīnwǎn kàn diànyǐng háishì tīng yīnyuè?", "Esta noite cinema ou música?", "Tonight, movie or music?", "¿Esta noche película o música?"),
      L("B", "我想看电影。", "Wǒ xiǎng kàn diànyǐng.", "Quero ver um filme.", "I want to watch a movie.", "Quiero ver una película."),
      L("A", "好，我们七点半出发。", "Hǎo, wǒmen qī diǎn bàn chūfā.", "Ok, saímos às sete e meia.", "Okay, we leave at seven thirty.", "Vale, salimos a las siete y media."),
    ],
  },
  // Block 13 — modals
  {
    id: "mustGo",
    categoryId: 13,
    lines: [
      L("A", "对不起，我得走了。", "Duìbuqǐ, wǒ děi zǒu le.", "Desculpa, tenho de ir.", "Sorry, I have to go.", "Perdona, me tengo que ir."),
      L("B", "这么急吗？", "Zhème jí ma?", "Com tanta pressa?", "In such a hurry?", "¿Con tanta prisa?"),
      L("A", "对，我必须赶火车。", "Duì, wǒ bìxū gǎn huǒchē.", "Sim, tenho de apanhar o comboio.", "Yes, I must catch the train.", "Sí, tengo que coger el tren."),
    ],
  },
  {
    id: "mayAsk",
    categoryId: 13,
    lines: [
      L("A", "我可以进来吗？", "Wǒ kěyǐ jìnlái ma?", "Posso entrar?", "May I come in?", "¿Puedo entrar?"),
      L("B", "请进。", "Qǐng jìn.", "Entra.", "Please come in.", "Pasa."),
      L("A", "谢谢。", "Xièxie.", "Obrigado.", "Thanks.", "Gracias."),
    ],
  },
  {
    id: "shouldSleep",
    categoryId: 13,
    lines: [
      L("A", "你明天有考试吗？", "Nǐ míngtiān yǒu kǎoshì ma?", "Tens exame amanhã?", "Do you have an exam tomorrow?", "¿Mañana tienes examen?"),
      L("B", "有，我应该早点睡。", "Yǒu, wǒ yīnggāi zǎo diǎn shuì.", "Sim, devia dormir cedo.", "Yes, I should sleep early.", "Sí, debería dormir pronto."),
      L("A", "加油！", "Jiāyóu!", "Força!", "You can do it!", "¡Ánimo!"),
    ],
  },
  // Block 14 — location / motion
  {
    id: "bookHere",
    categoryId: 14,
    lines: [
      L("A", "我的书在哪儿？", "Wǒ de shū zài nǎr?", "Onde está o meu livro?", "Where is my book?", "¿Dónde está mi libro?"),
      L("B", "书在桌子上。", "Shū zài zhuōzi shàng.", "O livro está em cima da mesa.", "The book is on the desk.", "El libro está en la mesa."),
      L("A", "找到了，谢谢！", "Zhǎodào le, xièxie!", "Encontrei, obrigado!", "Found it, thanks!", "¡Encontrado, gracias!"),
    ],
  },
  {
    id: "goThereNow",
    categoryId: 14,
    lines: [
      L("A", "你现在去哪儿？", "Nǐ xiànzài qù nǎr?", "Para onde vais agora?", "Where are you going now?", "¿Adónde vas ahora?"),
      L("B", "我去学校。", "Wǒ qù xuéxiào.", "Vou para a escola.", "I'm going to school.", "Voy al colegio."),
      L("A", "路上小心。", "Lùshang xiǎoxīn.", "Vai com cuidado.", "Be careful on the way.", "Ve con cuidado."),
    ],
  },
  {
    id: "haveNoTime",
    categoryId: 14,
    lines: [
      L("A", "你今天有时间吗？", "Nǐ jīntiān yǒu shíjiān ma?", "Tens tempo hoje?", "Do you have time today?", "¿Tienes tiempo hoy?"),
      L("B", "今天我没有时间，明天可以吗？", "Jīntiān wǒ méiyǒu shíjiān, míngtiān kěyǐ ma?", "Hoje não tenho tempo, amanhã serve?", "I don't have time today, is tomorrow okay?", "Hoy no tengo tiempo, ¿mañana vale?"),
      L("A", "可以，明天见。", "Kěyǐ, míngtiān jiàn.", "Sim, até amanhã.", "Sure, see you tomorrow.", "Vale, hasta mañana."),
    ],
  },
  // Block 15 — review phrases
  {
    id: "reviewGreet",
    categoryId: 15,
    lines: [
      L("A", "早上好！你好吗？", "Zǎoshang hǎo! Nǐ hǎo ma?", "Bom dia! Como estás?", "Good morning! How are you?", "¡Buenos días! ¿Cómo estás?"),
      L("B", "我很好，谢谢。你呢？", "Wǒ hěn hǎo, xièxie. Nǐ ne?", "Estou bem, obrigado. E tu?", "I'm fine, thanks. And you?", "Bien, gracias. ¿Y tú?"),
      L("A", "我也很好。", "Wǒ yě hěn hǎo.", "Também estou bem.", "I'm fine too.", "Yo también bien."),
    ],
  },
  {
    id: "reviewThanks",
    categoryId: 15,
    lines: [
      L("A", "谢谢你帮我。", "Xièxie nǐ bāng wǒ.", "Obrigado por me ajudares.", "Thanks for helping me.", "Gracias por ayudarme."),
      L("B", "不客气。", "Bù kèqi.", "De nada.", "You're welcome.", "De nada."),
      L("A", "对不起，我来晚了。", "Duìbuqǐ, wǒ lái wǎn le.", "Desculpa, cheguei tarde.", "Sorry I'm late.", "Perdón por llegar tarde."),
      L("B", "没关系。", "Méi guānxi.", "Não faz mal.", "No problem.", "No pasa nada."),
    ],
  },
  {
    id: "reviewFarewell",
    categoryId: 15,
    lines: [
      L("A", "再见！明天见。", "Zàijiàn! Míngtiān jiàn.", "Até logo! Até amanhã.", "Goodbye! See you tomorrow.", "¡Adiós! Hasta mañana."),
      L("B", "再见，路上小心。", "Zàijiàn, lùshang xiǎoxīn.", "Até logo, vai com cuidado.", "Bye, take care on the way.", "Adiós, cuidado en el camino."),
      L("A", "好的，你也保重。", "Hǎo de, nǐ yě bǎozhòng.", "Ok, cuida-te também.", "Okay, you take care too.", "Vale, tú también cuídate."),
    ],
  },
];

writeFileSync(out, JSON.stringify({ sections }, null, 2) + "\n", "utf8");
console.log("Wrote", out, "sections:", sections.length);
