"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ItemDetailContent() {
  const params = useParams<{ listId: string; poiId: string }>();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Item {params.poiId}</div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {/* TODO: afficher les détails du POI */}
        Placeholder item details
      </div>

      <Button variant="outline" onClick={() => router.push(`/app/lists/${params.listId}`)}>
        Back to list
      </Button>

      <div>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Vero deserunt quisquam adipisci
        quos atque dolore velit excepturi quibusdam, in minus expedita voluptatem nostrum ad
        provident beatae exercitationem maiores aperiam dolorem distinctio libero quidem dolor
        veniam facilis. Corporis debitis nihil libero aliquid, animi atque sapiente expedita
        tenetur, nostrum nesciunt iusto voluptatem harum. Eligendi, consequatur. Hic, ducimus
        corrupti. Beatae eos delectus inventore porro explicabo quas officia necessitatibus quam
        impedit consectetur consequuntur neque maxime, molestias provident hic. Neque, repellendus
        amet voluptatibus nam assumenda dolorum vero tenetur pariatur aut voluptates quis voluptate
        commodi quasi praesentium eos perferendis. Nesciunt ipsam consequatur quia quibusdam,
        officia esse sint ratione nulla quo eum, minus voluptate amet aliquam assumenda, aliquid
        laudantium itaque facilis explicabo accusantium? Laborum, quas doloribus laboriosam, sunt
        quasi quo delectus dolorem cupiditate assumenda dolore soluta nemo iusto repudiandae nisi,
        provident esse maxime quaerat odio ullam quibusdam explicabo! Libero consequuntur corporis
        sequi nesciunt harum ab obcaecati eveniet blanditiis architecto, beatae, quia alias odit
        corrupti ad. Molestiae nisi velit doloribus laborum atque, quia eaque odio iure qui numquam
        voluptatem error suscipit dolorem facere iusto perferendis incidunt. Modi ut iure eos.
        Quidem consequuntur ut sed explicabo, vitae iusto animi, omnis, aspernatur optio aliquid
        pariatur cupiditate nam excepturi illum nostrum suscipit nemo laborum fugiat dolores totam
        magni exercitationem vero temporibus. At ad laudantium quaerat fuga, velit amet sed
        expedita. Alias, dolorum. A accusamus maiores unde quia placeat porro aspernatur quo neque
        tempore, quis esse, quos, illum consequuntur fuga inventore? Eos dicta non possimus corporis
        cum maxime iste doloribus quidem est, iure placeat odit fuga quae ad. Error natus officiis
        nisi sed labore cumque nostrum ullam laudantium accusamus. Eum, nisi. Veritatis quibusdam
        recusandae saepe quasi error beatae sint nobis facere! Eaque itaque vero illo ex dolorum.
        Inventore, vero sapiente mollitia molestias minus aut ad, quod esse nisi, suscipit assumenda
        non odio explicabo error dolor maiores earum id. Adipisci fugiat a similique, molestias
        labore facilis asperiores porro quia minima quod doloremque fuga sint voluptatum quibusdam
        dolorem alias dolore, dolores deleniti accusamus. Doloribus adipisci praesentium reiciendis
        magni possimus quis veniam, autem laudantium neque itaque recusandae impedit quasi fuga
        repellat eaque atque nobis non voluptas suscipit dolorum, culpa hic aperiam! Accusantium
        eius quis quia, ab numquam, similique optio saepe eaque voluptates assumenda incidunt
        possimus recusandae sit modi, repellat dolorum reprehenderit. Nam culpa repellendus illum
        sunt aliquid facilis quasi magnam voluptate. Enim officiis repellendus sed ea quasi
        cupiditate autem at nemo saepe eaque labore consectetur neque hic modi adipisci est
        laudantium, fugiat molestiae nostrum veritatis! Obcaecati, enim fugiat optio repellat
        laudantium tempora laborum adipisci debitis sint officiis quas suscipit, veritatis ipsa
        molestiae at expedita, quisquam repellendus ratione fugit sunt facilis numquam deleniti. Eum
        nesciunt numquam molestias pariatur libero cumque. Error a quaerat dolorem numquam provident
        voluptates repudiandae, laborum ullam minima sit dolorum nesciunt est fugit non incidunt
        consectetur. Iure illum aspernatur libero! Aut illum, possimus alias provident modi quo nisi
        incidunt aliquam iusto sapiente, atque accusamus debitis eligendi quidem officia? Ratione
        dolorem alias iure molestias ex sapiente odio, consequuntur fugiat quasi aspernatur
        cupiditate magnam provident optio veniam rerum minus error totam dolores corrupti nostrum?
        Beatae obcaecati corporis praesentium quidem officiis repellendus, aliquam numquam. Magnam
        ex quod repudiandae. Autem excepturi similique aspernatur odit tenetur a ullam tempore rerum
        optio. Explicabo culpa, tempore sunt autem reprehenderit ullam iure praesentium velit
        facilis error vitae in blanditiis deleniti! Odit sed totam hic obcaecati, iste debitis
        laudantium magnam sit omnis, harum, cupiditate nulla praesentium. Est recusandae, quia
        molestias fugiat voluptates doloremque velit excepturi aut, consectetur voluptatibus nemo
        quos maiores eius, quidem a iusto laboriosam deserunt tenetur! Doloribus mollitia soluta
        assumenda reprehenderit ipsum eaque dignissimos aperiam minima at, corrupti voluptas
        adipisci possimus unde eius ipsa repudiandae temporibus repellendus quos repellat provident,
        ducimus recusandae! Sed magni eum reiciendis nulla id eveniet exercitationem accusamus, ex
        minima doloribus aliquam omnis deleniti cupiditate maxime, praesentium incidunt ad sapiente
        facere, totam vel? Explicabo, culpa molestias. Quaerat ab, consectetur voluptas enim officia
        velit et atque sint cumque perferendis praesentium, mollitia, sequi asperiores! Natus quod
        aliquid ullam voluptatem atque ipsa possimus a ex dicta nisi, beatae odio ut suscipit
        corrupti sint repellendus optio, nemo amet, dolorum provident sed eius repudiandae. Minus
        recusandae, consectetur labore pariatur delectus, sapiente, quasi earum sit praesentium cum
        aliquid id harum soluta doloribus ab laborum voluptates accusantium! Repellat, doloremque
        sint. Eos rem atque voluptatem a. Nobis, deleniti! Eaque architecto blanditiis mollitia
        cupiditate molestias itaque ipsum, natus deserunt eos, quia recusandae aspernatur? Culpa
        modi ipsa consequuntur possimus excepturi! Dolorum ipsa facilis culpa quod corrupti dolore
        veritatis quia nihil quos, unde porro minus, eligendi ipsam, officiis magni animi
        exercitationem voluptatibus facere sit numquam possimus asperiores dignissimos iste? Error
        cumque ab nostrum repellendus voluptates consequuntur ex voluptatem quod dolorem commodi
        repellat iste soluta, iure dicta voluptatum nesciunt! Iusto non sapiente deserunt, dicta
        quibusdam deleniti vero libero amet molestias modi consequatur odio quaerat, pariatur esse
        dolores obcaecati hic consequuntur, porro ratione quidem reprehenderit in cupiditate?
        Temporibus optio, quas dicta nostrum velit modi in officia reprehenderit ipsam. Mollitia
        voluptate delectus soluta consequuntur animi eius nemo repellat architecto ipsam? Dolor
        quasi adipisci unde delectus quos incidunt omnis, vero, sapiente quaerat a ipsum aut. Est
        atque aut labore quo minima debitis, delectus corporis quasi quod nam distinctio laudantium
        quidem nemo ratione error officiis eum illo in esse earum culpa repellendus sint! Laboriosam
        alias porro molestias placeat non ullam libero explicabo sed sunt facere omnis incidunt
        dignissimos, recusandae cumque ipsa vel dolore doloremque a! Ad, officia. Non, similique
        quia. Quisquam fugiat dignissimos eum dolorum consequuntur eius laudantium! Dolorem
        dignissimos dicta quaerat, architecto recusandae magnam delectus voluptas nostrum suscipit
        similique ipsam maxime nesciunt neque quod. Dolorum praesentium odio fugit ut corrupti
        maiores tenetur provident laborum atque perferendis, omnis aliquam tempora repudiandae vel,
        saepe illo fugiat excepturi architecto voluptatibus officia. Laudantium perspiciatis nulla
        deserunt minima dicta sequi voluptatibus, earum maiores, porro odit tempore, ad beatae ipsum
        voluptatum asperiores! Pariatur fugit laboriosam architecto non neque excepturi placeat
        culpa voluptas labore laborum repellat, eum vero, quasi quaerat enim, eligendi molestiae.
        Expedita, molestiae unde. Doloribus totam reiciendis eum mollitia necessitatibus iusto?
        Libero facere corporis numquam nobis quidem, illum nisi unde culpa quam est id ab, mollitia
        temporibus error possimus. Quod, veniam perspiciatis error eligendi dignissimos id placeat
        fuga rerum provident cum! Consequatur cum odit quos debitis at iure iusto sunt ipsa, labore
        consequuntur ducimus. Sint animi quod vel eum expedita. Iusto et neque officiis, sapiente
        modi repudiandae, officia voluptas placeat sit corporis veniam sint culpa totam quod minima
        atque quis cupiditate laborum consequuntur. Iusto vero quis maiores impedit corporis
        perspiciatis id veniam sed consequatur, autem asperiores eos porro eum cumque repudiandae
        maxime dolore ducimus! Illum quisquam ducimus neque nemo? Dicta quas dolores at dolorem.
        Facere, amet quae atque voluptate voluptatum ea quos reprehenderit ratione nam officia aut
        repellendus id. Quas sed obcaecati aliquam animi enim, nostrum mollitia eveniet unde optio
        facilis iusto quam iure quo ex necessitatibus aspernatur debitis esse dolorem dolor minus
        quibusdam! Voluptatum quas perspiciatis unde doloremque, laboriosam ratione earum laudantium
        sequi voluptas soluta incidunt, impedit, fugiat praesentium enim ipsam dolore numquam
        reprehenderit dolorum illum delectus blanditiis esse? Consectetur vero facere dignissimos
        repudiandae mollitia? Eveniet molestiae repudiandae unde! Perferendis nulla ullam, iure
        asperiores id soluta ipsa obcaecati dolorem reprehenderit culpa a quas itaque velit,
        adipisci laudantium blanditiis commodi, repellat ex animi. Sequi illum dolorem non est ad
        debitis optio error mollitia ab numquam aliquid, quae molestias autem pariatur! Minus, neque
        necessitatibus. Doloribus eos, debitis explicabo, quos quasi magni similique error minus
        laboriosam iure, beatae voluptates. Harum blanditiis facere tenetur sapiente. Ullam,
        accusantium ut ex repudiandae delectus, qui quidem pariatur quo laudantium dolores nulla
        eligendi odio dolor molestiae sit sed a. Illum sint officia magni explicabo nostrum sit
        distinctio, cumque consectetur a? Voluptas expedita similique possimus blanditiis molestiae,
        aperiam ipsam necessitatibus quaerat qui cum aliquid quis dolorum dolorem delectus nulla
        reprehenderit non aliquam neque est, officiis enim? Rem cum, vero tempora nobis alias, autem
        magni aliquid voluptas impedit earum, ipsum tenetur qui sapiente! Atque vitae distinctio
        libero odit dolor nemo quo laboriosam dolorum rem error? Veritatis dolor quod explicabo, ea
        magni repellat quasi eveniet possimus ratione modi, odit quas fuga totam quaerat ipsam
        repellendus nemo sapiente minus distinctio similique reiciendis mollitia? Voluptate
        perspiciatis earum iusto dolorum vel? Ipsum beatae adipisci fugiat minus perspiciatis
        quaerat consectetur porro fugit libero esse. Ipsa tempora fugiat eligendi consectetur magni
        quasi, eaque itaque in ratione dolorum quos veritatis nesciunt, distinctio consequuntur
        quaerat officiis possimus aspernatur sequi nisi quae quam cupiditate. Aperiam ipsam vitae
        molestias eaque adipisci pariatur optio, dolorem perferendis ad tempore, voluptatem rem
        numquam veniam illum non. Beatae distinctio nemo eos dolorum. Expedita doloribus veniam cum,
        nobis illum natus sed, voluptatum asperiores odio iure dolore! Debitis itaque quibusdam,
        facere enim at vitae. Voluptatem maxime veniam sit illo omnis consequatur, perspiciatis
        ipsum earum nihil obcaecati repudiandae totam impedit recusandae beatae quia minima nostrum
        iste ratione laboriosam reprehenderit. Ex itaque iusto laudantium cumque provident illo
        consequatur molestias sint doloremque aperiam impedit dignissimos consectetur dolorem,
        maxime autem molestiae, reprehenderit laborum doloribus ipsa deleniti praesentium nesciunt
        fuga. Repudiandae, consectetur non aperiam ullam dolore dicta vero, ipsum cum ad aliquam
        voluptatum nam, iste voluptate minima soluta qui! Rerum quasi inventore impedit natus
        exercitationem nulla, nam perferendis alias, illo, velit optio obcaecati. Minus ipsum
        expedita iure quod. Sequi quibusdam eaque, alias molestias nobis culpa, tempore illum,
        voluptates iste aut eos quos eius quas. Quos explicabo ipsum maxime ullam quaerat, mollitia
        praesentium eius, voluptatem laudantium quia earum necessitatibus quibusdam dicta similique
        quidem molestiae quam officiis. Ullam officia quae magnam necessitatibus, illo repellendus
        ipsam odit cupiditate commodi expedita molestiae consequatur, ducimus temporibus. Nesciunt
        cupiditate neque sint ea sapiente saepe incidunt tempora, libero est voluptate amet voluptas
        adipisci consequatur autem? Reiciendis inventore libero est nostrum ad culpa laboriosam,
        itaque veritatis natus voluptates, omnis, dolor ullam id voluptatibus vitae expedita dolores
        sapiente eaque possimus odit assumenda modi at necessitatibus! Adipisci reprehenderit nihil
        quos voluptates? Laboriosam impedit tempore ipsa. Aliquid quis dignissimos natus omnis
        harum, suscipit sequi excepturi modi enim illo est odit eligendi error corporis consequuntur
        saepe beatae minus nulla. Consectetur cum eius consequuntur nostrum, sed asperiores iusto
        laudantium a deleniti, et quas sequi fugit. Veritatis ratione dicta architecto ipsam id
        aspernatur nostrum! Ea excepturi ut ullam quisquam earum eaque numquam, reprehenderit
        explicabo, officiis harum vel rem repudiandae accusamus. Illo repudiandae expedita veritatis
        harum earum incidunt voluptates illum. Aliquam odit mollitia cumque numquam ducimus iure
        eaque saepe atque distinctio nulla labore sed facere libero voluptatem, natus autem
        laudantium pariatur officia rerum odio delectus ratione veniam eum eos. Consequatur maiores
        incidunt sit. Tempora fugit, eius doloremque quia error officia voluptate minus, id,
        blanditiis esse maxime? Quibusdam odit id aperiam laudantium sed culpa amet vel nesciunt,
        labore sit magni, dolorum facere quisquam optio, obcaecati reprehenderit delectus ipsa
        repellendus autem. Veniam, explicabo? Fuga expedita enim natus nemo culpa vel ad
        necessitatibus libero obcaecati illum fugiat commodi, cupiditate autem eius molestiae, id
        voluptates quos voluptatum nesciunt veniam voluptas iste? Ullam esse quod ab nesciunt iure
        labore, minus nisi sapiente voluptatem, odio deserunt quam voluptas aliquid autem porro.
        Ipsa recusandae, facilis enim tenetur odio ea quam laborum, eaque soluta delectus odit.
        Eligendi ipsum pariatur alias cumque temporibus laborum minima! Ea unde in fugit commodi
        quod odit maxime incidunt iusto labore sapiente quisquam facilis praesentium, nulla
        accusamus natus impedit nemo quis iure facere molestiae ipsam ut quasi aut? Consectetur vel
        suscipit tempore cupiditate veritatis aliquam? Laboriosam quasi labore commodi, assumenda
        quas, dolore non voluptas cumque esse inventore eligendi nisi, dignissimos tenetur. Ex
        deleniti, debitis itaque laudantium facere iusto, aliquam nostrum laborum nulla modi
        mollitia expedita assumenda temporibus enim, dolores quibusdam? Amet ad incidunt cum, natus
        corporis itaque velit officiis vitae fugiat placeat debitis dignissimos quas blanditiis
        tempore aliquid, earum rerum dolorum? Vel, hic iusto est amet, eveniet officiis nemo iste
        alias sunt facere deleniti ex minima soluta nihil odit vero dolore molestiae nostrum maxime
        quaerat illum nobis id architecto quod! Pariatur necessitatibus at doloremque quam nesciunt
        velit hic totam facilis iure dolores, error, esse est recusandae sed tempora ex expedita?
        Harum dolores consequuntur sed tenetur magni laboriosam nulla voluptatibus officia, at
        placeat tempora dolorum excepturi iusto repudiandae repellat commodi distinctio dolor animi
        et adipisci, odit ipsam cum possimus! Error excepturi reiciendis repellat consequuntur
        voluptatum beatae libero veritatis placeat dolor, inventore fugiat neque at impedit eos enim
        doloremque porro cumque velit reprehenderit architecto cupiditate nemo, cum deserunt. Nisi
        est, sint quas hic ipsum officia eveniet illum aut cumque id corporis ducimus, nihil
        veritatis, explicabo vero! Earum cupiditate iure excepturi suscipit nulla facere atque quas
        ex! Facilis deleniti officia ad eos tenetur vero vel explicabo maxime. Repellat ea
        aspernatur, distinctio reiciendis obcaecati dolore tenetur enim eveniet perferendis nam
        nobis provident deleniti voluptas, aut vero dolorum fugiat nulla ex? Similique, rerum
        aliquid nemo ex quae illo doloribus beatae placeat deserunt nisi excepturi aperiam molestiae
        repellendus officiis inventore vitae consequatur porro, qui voluptates fuga laborum itaque!
        Eveniet fugiat sapiente nisi veniam in eaque, magni quia deleniti error quas necessitatibus
        dignissimos at, ea praesentium sint alias molestias ducimus officia aliquam culpa? Iusto
        asperiores consequatur dolore qui modi aspernatur. Dolorum illo aperiam nemo, voluptatum
        ducimus repellat, eligendi necessitatibus veritatis neque, deserunt facilis velit? Maiores
        nobis rerum molestiae labore non et deleniti. Repudiandae, dolor? Ut qui, officia
        perspiciatis illum laboriosam unde at totam nam quaerat accusantium! Laborum aut porro
        exercitationem maiores recusandae at rem quia eius! Accusamus totam nobis veniam rem aliquid
        dolores esse sint voluptatem sit quia possimus nulla temporibus placeat eligendi nisi, odio
        ipsam dolorum ipsum culpa suscipit inventore, aliquam vel perferendis fuga! Nam a nostrum
        voluptas numquam non atque eaque, doloremque, eos consequuntur adipisci ad, error
        praesentium ducimus distinctio obcaecati voluptatibus officia! Recusandae, maiores laborum
        voluptates iusto quidem culpa! Natus, odit veniam unde odio animi quia ex libero minima
        similique eum sunt, praesentium sit molestias nulla consectetur aperiam necessitatibus
        incidunt, veritatis placeat asperiores ipsum quam minus. Eligendi maiores error impedit a
        nisi! Esse possimus saepe animi voluptatibus magni quod ducimus in, temporibus veniam nulla
        repellendus ipsam. Aperiam iusto suscipit repellendus, quam, ipsa quis nesciunt dignissimos
        rerum eius neque laboriosam! Culpa hic adipisci esse dolor? Necessitatibus eius cumque qui
        adipisci, est excepturi, enim, quod cum et laboriosam vel dolorem quas eveniet optio
        praesentium. Nulla sequi labore possimus, corporis ullam dolorum rerum. Omnis sunt deserunt
        sed minima adipisci voluptatem et velit rem hic architecto debitis culpa, expedita at
        quibusdam inventore aliquam necessitatibus molestiae. Aspernatur corporis totam odit
        quibusdam commodi distinctio laudantium nihil eos dolores? Quibusdam sequi maxime hic
        dolorem dolorum voluptate odio! Harum nulla facere aliquam dolor asperiores eos ratione.
        Sed, fugit maxime quasi ullam libero nihil delectus inventore culpa expedita asperiores
        provident earum beatae dicta vel ipsam nisi commodi in adipisci neque! Quod ut amet sint
        atque voluptas quia temporibus odit fugit quos alias. Id perspiciatis consectetur dolore,
        ipsum quibusdam rerum veritatis illo temporibus placeat obcaecati culpa minus porro, ratione
        excepturi dignissimos, ipsam dicta! Repellat ipsa quis autem quod rerum, beatae reiciendis
        dicta impedit deleniti id numquam quibusdam assumenda provident, quam placeat exercitationem
        consectetur. Quaerat quisquam corrupti quia! Eveniet consequuntur mollitia ea ullam dicta
        incidunt dolor quaerat nam, doloremque repudiandae ab. Laborum possimus vitae corrupti
        facilis pariatur iusto? Porro autem neque tempore voluptatum pariatur maxime blanditiis
        sequi, est iure assumenda rem dolor eius, voluptatibus recusandae. Repellat obcaecati enim
        ex. Harum repellat voluptates, nemo ipsa ea ad vero. Eaque minima quia aliquid consequuntur?
        Libero totam iusto natus nisi, non voluptas aut voluptates architecto dolores eligendi
        perspiciatis sit sint at quisquam explicabo reprehenderit, fugit dolore exercitationem
        laboriosam rem dolorem? Aliquam, temporibus sequi! Repudiandae nulla molestias ipsam magni
        beatae, reiciendis necessitatibus omnis iure sequi quia et, dolorem enim obcaecati quaerat
        laboriosam. Accusantium maiores omnis hic laborum nulla similique repudiandae facere?
        Adipisci numquam dignissimos enim soluta totam eligendi, omnis at voluptate laudantium quam
        voluptatem debitis distinctio culpa esse similique labore iusto reprehenderit animi nihil
        tempore! Commodi nulla blanditiis porro dicta distinctio cumque quia eveniet, laboriosam
        dignissimos eos debitis, dolorem aliquid dolores, veritatis praesentium fugit perferendis!
        Modi repudiandae dolor ratione minima assumenda quos, cumque temporibus nulla in eveniet
        facere ab nobis nihil accusantium maiores, officia eaque dicta fugiat culpa nesciunt minus
        debitis consequatur tenetur est. Nihil aliquam libero voluptates eum vitae vel est
        distinctio. Voluptatum, tempore facere! Natus pariatur cupiditate sed perspiciatis, eligendi
        temporibus in quasi dolores exercitationem laborum et officiis dicta magni consequuntur
        fugit laudantium eaque tempora rerum quod, unde reiciendis. Quo, quas quasi expedita tempore
        eum qui vero fuga consectetur, ratione error cupiditate optio. Fuga quidem, laudantium
        numquam, eaque assumenda ducimus harum atque quia placeat molestiae quis magni excepturi
        natus nostrum delectus odio eum vel rerum error est iste? Doloribus ducimus itaque adipisci
        fugiat odit dolores voluptates quos. Cum vel sapiente veniam, maiores placeat saepe adipisci
        ex nostrum, delectus tempora ipsam non. Expedita porro, nihil inventore aspernatur quidem
        quasi omnis fugiat autem nobis aut minima tenetur, minus quo veritatis. At ea nam, dolorum
        quae esse illum sapiente, in blanditiis dignissimos nemo earum saepe placeat aliquid
        mollitia nulla. Quod odio enim eius, at debitis magni veniam dolore laudantium facere optio
        tenetur est ratione atque asperiores sunt voluptates officiis consequuntur praesentium quae
        iste aliquid qui adipisci repellat corrupti? Id molestias sunt possimus perspiciatis dolorum
        suscipit et officia natus, commodi ipsa! Beatae dolorem, maxime repellat aspernatur
        voluptatum ab consectetur, quia asperiores aliquam sed at quasi exercitationem earum tempore
        nihil sequi rem provident ad! Ullam ad dicta vero ratione beatae saepe, facilis nulla minima
        harum optio, sint voluptatum! Ratione veniam, perspiciatis animi quas quidem dolorem eos
        molestiae in cupiditate laboriosam a quasi adipisci totam facilis odio quo, modi rem
        quibusdam voluptatibus ea? Sunt quis quam ipsam enim temporibus consequatur debitis sed
        quaerat! Fugiat sapiente repudiandae error ducimus distinctio voluptatem et in nostrum, vel
        quod provident laborum facilis inventore, consequatur vero. Voluptas, rem! Ut, dolorem.
        Deleniti a illo, commodi cupiditate voluptatum harum fuga error iusto, impedit corrupti
        aspernatur iure. Commodi repudiandae suscipit, ullam ea voluptatem quae ipsum molestias
        itaque in ex iste harum voluptatum inventore et corrupti nulla, nostrum quisquam? Recusandae
        nemo, autem dignissimos vel sed sint odit magnam officia, molestias porro voluptas modi
        tenetur veritatis laborum fuga dicta fugiat doloremque illum inventore consequuntur placeat
        aut cum tempore! Sequi ipsa cupiditate quasi laudantium blanditiis ex, nemo itaque nihil
        illo recusandae mollitia, vitae nesciunt tenetur aspernatur possimus iste quo numquam odit
        vel quis. Delectus excepturi, itaque impedit accusamus voluptatum doloribus ipsam at eius
        dignissimos facilis quam, quas quaerat sunt dolorum ea architecto, accusantium quibusdam
        exercitationem assumenda! In reiciendis quaerat debitis, excepturi eos dignissimos non
        voluptatem voluptate odio porro voluptatum ratione veritatis perferendis. Asperiores nulla
        iusto velit, nihil delectus unde totam perspiciatis iste maxime excepturi! Vel ullam
        incidunt numquam amet, exercitationem, nostrum consectetur voluptas quasi eligendi inventore
        cupiditate aperiam, obcaecati velit natus provident sit similique eaque vero facilis
        accusamus excepturi reprehenderit ad accusantium. Sint sed tenetur maiores qui, repudiandae
        repellat id excepturi iure rem blanditiis atque pariatur similique quisquam aliquam hic
        tempora harum modi ea quam saepe incidunt. Fugiat eos assumenda quasi repudiandae ratione
        unde sint, saepe nesciunt iure sequi culpa suscipit, maxime odio consequatur est incidunt
        necessitatibus magni explicabo! Minus libero voluptatibus tempora aperiam repellendus. Esse
        suscipit vero quaerat quibusdam inventore autem perspiciatis qui quis. Quis suscipit
        perferendis aspernatur accusantium impedit nesciunt voluptates sunt! Fuga eveniet dolores
        accusamus laboriosam officiis velit facilis totam reprehenderit voluptatem, cum quod
        repellendus nobis tempora consequatur quas, maxime sed deserunt. Vel sed quas eos ut
        veritatis, magni voluptate minus, eum soluta, at dolore accusantium nam harum! Veniam
        placeat at, minima quaerat molestiae numquam atque maiores molestias magni assumenda aut
        culpa voluptatum maxime illum explicabo nostrum nulla quae laborum? Ducimus ut dicta
        officiis quasi impedit officia nesciunt minus, sed laboriosam esse necessitatibus aliquam
        ratione mollitia, quibusdam, ab cum tenetur illo pariatur distinctio dolor in! Autem, esse.
        Provident, accusamus? Rem illum iste ut architecto maiores laborum nam harum minus
        necessitatibus laudantium. Aliquam, illo? Ullam in aliquam, quidem nemo libero officiis
        harum cupiditate tenetur, quam similique culpa fuga mollitia tempora deserunt sunt eos minus
        autem placeat exercitationem optio non laborum odit eligendi. Blanditiis ad nisi dolor? Unde
        illum reprehenderit doloribus velit sint eligendi rerum similique minus. Commodi quos
        exercitationem quidem quaerat cupiditate! Praesentium illum sed temporibus. Beatae, vel
        maxime, eligendi voluptas, tempora soluta voluptatibus explicabo cumque quo corporis magnam
        repellendus nulla ratione? Dolor sint nihil expedita deserunt quasi! Veritatis dicta nemo
        corporis neque rerum animi omnis ea esse. Autem, tenetur repellat. Id voluptatum temporibus
        in totam sunt accusamus! Architecto tenetur doloremque optio, vel veniam magni esse. Maxime
        harum accusamus labore dolores similique magnam neque nesciunt officiis totam. Architecto
        unde sunt vero delectus pariatur qui odit, sequi laborum eveniet laudantium nam, asperiores
        inventore ab reprehenderit impedit voluptatum ipsum, mollitia quod autem quia veniam tenetur
        adipisci quas. Laudantium quod, ducimus magni commodi autem dolor maiores animi odit ullam
        fugit sed culpa nulla consequuntur, aut amet nam porro. Ducimus porro praesentium modi
        consectetur? Dolor adipisci quis et, veritatis voluptatibus dolorem? Mollitia saepe,
        distinctio recusandae, esse blanditiis et eum nostrum id exercitationem sunt perspiciatis
        tenetur molestiae beatae pariatur consequatur labore placeat ducimus iusto. Voluptatum
        magnam, cum corrupti nulla, quisquam, perspiciatis odit assumenda officiis totam dolorum
        eveniet! Dolorem laboriosam autem est officiis quos sint repellat porro id quam, architecto
        cumque ut neque perferendis placeat impedit suscipit ab velit aliquam, ullam laborum, magnam
        at molestias nisi. Repudiandae delectus adipisci omnis, soluta nisi labore impedit
        recusandae asperiores. Voluptatibus earum doloribus consectetur ipsa architecto debitis
        sequi ducimus asperiores iste perspiciatis laudantium soluta assumenda quis nesciunt
        ratione, in consequatur possimus at minus quam. Ipsam veniam accusamus, repudiandae itaque
        aliquam saepe quidem unde ullam in ad dolorem, aut magnam voluptate qui, esse facilis labore
        incidunt reiciendis corrupti consequatur cumque voluptatum distinctio rerum? Corrupti quod
        praesentium alias reprehenderit odio sed ut optio deleniti modi quam vitae recusandae
        perspiciatis, quia neque fuga veniam id nostrum nemo officia esse! At esse eveniet facilis,
        quisquam laudantium incidunt nisi expedita dolorem sit perspiciatis rerum, fugit, possimus
        quam quo corrupti ea vitae magni? Non amet ratione quis voluptates adipisci repellendus
        nobis optio porro repellat a nostrum alias iste tempora unde eligendi cum molestiae, aliquid
        neque perferendis provident assumenda vero. Dignissimos illo, minima nemo at eveniet alias
        aliquam quibusdam nisi nobis dolor blanditiis odio facilis, quam, perferendis ratione eius
        natus impedit debitis incidunt enim! Architecto iure molestiae saepe blanditiis a iusto
        accusantium in omnis consequatur alias nostrum dicta cupiditate, ratione quidem, quaerat hic
        libero ex earum perspiciatis possimus, recusandae quod dolorum! Doloremque, sunt
        dignissimos. Sapiente totam numquam ut cum veniam, dolores, culpa consequuntur voluptate sit
        tempore ea ipsa ex nihil nesciunt maiores blanditiis eligendi vitae rem incidunt possimus
        inventore. Incidunt, minus consequatur, tempora architecto consectetur nisi voluptatum
        laboriosam odit quis cumque, magni non atque harum amet vero deleniti numquam doloremque
        iure deserunt neque quo aspernatur corporis laudantium suscipit? Corrupti porro dolor quae
        impedit aperiam consequuntur, dolores, asperiores tenetur dolore mollitia fugiat soluta quia
        nostrum omnis quaerat modi ab odio laudantium laboriosam. Possimus eum placeat nobis iure
        facere aperiam iusto sit est pariatur, enim repudiandae voluptate quos mollitia sint modi
        porro consequatur! Laborum qui accusamus, consectetur cumque delectus veniam sunt? Corrupti
        fugiat aut suscipit voluptate magnam earum facere labore, provident consequatur quis!
        Molestiae autem facilis rem sunt molestias soluta at! Aliquam eveniet quidem quisquam cumque
        consectetur dicta soluta. Amet facere nam aliquam sed pariatur reiciendis ad voluptas
        voluptatum fugiat, repellendus ducimus maxime, illo rem dolore! Aut nesciunt illum cumque
        hic quas id ipsum ex rem atque eligendi, quis culpa velit iste amet! Perspiciatis officia
        incidunt earum quia fugit laborum fuga cum. Amet eum hic, voluptatem tempore tempora
        quibusdam delectus doloribus praesentium laborum, nostrum iusto, corrupti modi quidem libero
        ea officiis sapiente inventore molestiae a? Quos iure veritatis inventore voluptate
        perspiciatis rem necessitatibus error totam sint tempora assumenda ipsam hic provident, unde
        voluptates enim, magnam placeat libero aut laudantium. Temporibus quos at quibusdam.
        Quisquam sit veniam inventore veritatis, autem similique doloremque officia quis facere
        itaque eos earum animi reiciendis in fuga numquam illum debitis repudiandae! Nisi,
        temporibus sapiente esse nihil eaque pariatur officiis quas nam! Officia nostrum dicta
        voluptatum perspiciatis iusto ullam consequatur velit repellendus est, ducimus dignissimos
        magnam? Dolores voluptas atque est. Iusto eligendi quasi quisquam voluptas molestias dolor
        quidem, provident assumenda, est officiis, dicta quam! Accusamus saepe, nostrum omnis
        consequuntur sunt voluptas ducimus dolorum quia! Tenetur, illo beatae maxime sequi quae
        pariatur saepe quas eveniet? Laboriosam ipsum sequi blanditiis, voluptates ipsam illum
        pariatur ducimus nulla recusandae eius nihil facilis, hic asperiores nostrum sit ipsa natus
        qui in rerum maiores deleniti sunt assumenda id suscipit. Earum dolor doloremque saepe in
        fuga harum autem, veritatis totam consequuntur dolores quo voluptatibus obcaecati quisquam,
        praesentium voluptatum blanditiis consequatur ex maiores. Alias quae, quasi, eaque impedit
        pariatur ratione sint quidem voluptate nobis laudantium ipsam maxime tempore et, eos eius
        earum nihil! Adipisci, molestiae reiciendis atque repellat sit suscipit modi a illo ea saepe
        harum perferendis quis culpa eligendi voluptate, quos vel sed deserunt dolorem aut sunt quae
        perspiciatis! Accusantium necessitatibus saepe nesciunt, enim autem soluta quidem similique
        veniam quo, nam minus non incidunt numquam sunt ipsam aliquam quisquam quis. Sapiente optio
        ab aliquid assumenda odit dolor natus fuga consequatur facere excepturi hic est tempora ex
        perferendis sit rem molestias dignissimos maxime, quaerat possimus! Mollitia doloribus
        provident earum similique fugiat aspernatur possimus laborum. Impedit est laudantium dolor
        porro eius qui a, corrupti autem iste? Amet corporis nulla facilis non voluptatum corrupti
        inventore voluptate deleniti sed doloribus, quaerat sint consequuntur a molestias
        repudiandae ratione quos. Laudantium in eaque aliquam iste velit explicabo nobis cum porro
        saepe molestiae suscipit minima accusamus, maxime officiis repellendus aliquid. Illo cum
        tempore magni culpa quisquam quasi officiis optio, sequi quas mollitia aperiam! Earum, quos
        quo perferendis asperiores corrupti labore omnis, sed debitis aperiam, nisi atque
        necessitatibus. Porro asperiores pariatur quaerat veniam sequi consequuntur officia hic ad
        tenetur eveniet. Tempora dolores eius odio deserunt commodi ducimus maxime? Vitae molestiae
        accusantium consequuntur ipsum doloremque id est. Commodi aperiam quas sunt maiores nulla
        aspernatur officia repudiandae nesciunt quam, explicabo quibusdam quo exercitationem
        voluptatibus ab vitae obcaecati praesentium id iure impedit beatae minima. Facere animi
        culpa maiores eaque dicta ipsum nesciunt necessitatibus iste, amet similique reiciendis
        veniam quasi eum maxime neque. Culpa placeat labore, harum nulla non atque. Beatae enim
        delectus, velit in doloribus repudiandae consectetur recusandae cumque culpa vel asperiores
        ratione odit rem? Ipsam, inventore placeat alias perferendis omnis ab commodi dignissimos
        sed corrupti temporibus veritatis quos, suscipit accusantium! Nobis vel ea voluptatem eum,
        excepturi doloremque nulla aspernatur a perspiciatis deleniti eos totam ratione veniam sunt
        animi? Eaque velit soluta dolor et magni eveniet perferendis illum voluptates, accusantium,
        impedit quasi ratione corporis provident nemo fugit consequuntur cumque reprehenderit
        aliquid minima culpa illo molestias! Quod quaerat minima, iste repellat aspernatur a
        accusamus est, facilis eos officiis dolorum obcaecati. Vel repudiandae modi suscipit ipsa
        qui sequi dolor obcaecati, earum blanditiis aperiam impedit incidunt rerum architecto
        temporibus reprehenderit molestias laboriosam nam sit laudantium fuga aut nemo alias
        cupiditate. Asperiores excepturi culpa ab exercitationem fugit facere iure, quis pariatur
        aliquid provident laborum. Ducimus soluta corporis numquam nostrum porro necessitatibus
        expedita aliquam beatae laboriosam sint harum modi iure dolore, nisi quae repudiandae, vel
        maxime quod incidunt magni dicta quasi iste libero quia. Sapiente molestias, iste fuga
        blanditiis nobis doloremque nemo. Debitis tempora nam sapiente voluptates. Nihil deserunt,
        rem illo vel nobis repellendus dolores asperiores ullam quo cumque et quos atque eius,
        laudantium inventore nostrum harum quis! A aperiam, accusantium libero eaque ipsa cum
        accusamus cupiditate possimus voluptatem architecto facere quos. Reiciendis enim excepturi
        ducimus, laudantium rerum quaerat placeat aliquid, recusandae adipisci doloremque aperiam,
        at consectetur ipsum! Praesentium provident tempora, optio commodi natus delectus repellat
        quas quidem perferendis eaque exercitationem numquam error qui culpa maxime. Ullam hic
        dolorem odit consectetur neque praesentium consequuntur officiis deleniti cupiditate. Ut
        nisi inventore quos at amet possimus architecto non deleniti nostrum asperiores laudantium
        sint neque sunt, dolore natus, aspernatur obcaecati, quasi voluptate modi ad debitis ratione
        libero. Aliquam, maiores tenetur. Repudiandae quam quae, ratione blanditiis saepe sunt
        sapiente totam quos ea necessitatibus nihil excepturi vitae dolorem eius sit magni commodi
        minus ad. Quia adipisci quod reiciendis ea, eos repellendus error animi cum fugit
        aspernatur, repudiandae ullam quae? Optio obcaecati deleniti vel id facere perspiciatis
        repudiandae similique iste suscipit voluptate consequuntur, cumque temporibus facilis
        impedit tenetur? Dolorum magni accusamus sit eius, nostrum quidem tempore aperiam sequi
        ducimus rerum possimus officia deserunt odio corporis esse veritatis ipsa explicabo maxime
        ex itaque dolor sed dignissimos illo. Praesentium quia dolore cupiditate corrupti eius
        dolorem. Est sequi sapiente quod fugit, animi ad eum molestias at debitis amet fugiat sit
        excepturi blanditiis id quia repudiandae adipisci obcaecati et suscipit distinctio nihil,
        nostrum impedit voluptatem officiis. Repellendus blanditiis consectetur officiis, vel
        dolores suscipit doloribus quisquam voluptates quibusdam excepturi maiores molestias omnis
        dolorem quae, amet numquam iusto impedit earum sit recusandae magnam nobis molestiae
        assumenda debitis. Sit mollitia ipsum aspernatur est ipsa beatae placeat iusto, magni, neque
        numquam ad tenetur hic culpa reiciendis quod unde consequatur excepturi nesciunt facere
        blanditiis. Ut sed est nulla harum! Dicta excepturi recusandae aut, reprehenderit aliquid
        dolorum fugiat ipsa voluptates impedit nemo explicabo facere officiis officia accusantium
        ratione itaque dolore amet blanditiis aspernatur perferendis corrupti iste distinctio
        possimus quaerat! At eveniet ab provident asperiores eos ad cum facilis modi ducimus
        repudiandae accusantium delectus quod excepturi laudantium, quasi, libero aspernatur
        blanditiis voluptate vitae, iure inventore! Nisi ratione ipsam nobis pariatur nihil deserunt
        veniam ducimus consectetur sequi magni, sunt fugiat reprehenderit obcaecati incidunt libero
        recusandae maxime minima explicabo. Mollitia esse repellat temporibus ducimus animi incidunt
        iste odio! Dolor repellendus ab quo, possimus magnam aliquam. Eius quasi nesciunt totam
        ratione atque minima nobis, alias vel tenetur sed nihil ducimus consequuntur? Beatae
        eligendi dolore voluptas ratione, qui consectetur! Consequatur ea possimus eius magnam quo
        quaerat, dolore, libero delectus at quidem molestias vero ratione eos quisquam illum qui
        corrupti impedit reiciendis et aperiam! A quam, distinctio odit voluptatibus vero quos
        repellat placeat est eaque quod eius iste assumenda illum quibusdam, numquam qui quaerat.
        Laboriosam ipsum aliquam sint, similique labore velit consequuntur. Eligendi voluptas,
        similique deleniti aliquam aliquid reprehenderit cumque, incidunt a excepturi facere
        voluptate dicta cum consequatur ipsum error necessitatibus illum expedita exercitationem
        eveniet, magnam impedit. Et fugit ad alias eum accusantium est ea esse architecto quo nemo,
        veritatis odit quia beatae soluta tempore, atque ratione amet adipisci repudiandae unde,
        asperiores voluptatibus quam dolorem consequatur! Maxime suscipit eligendi unde fuga,
        ratione eum accusamus quia laboriosam rerum iure blanditiis nulla alias perferendis sed
        dolorem aliquid, voluptas pariatur laudantium. Commodi!
      </div>
    </div>
  );
}
