"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function ListPanelContent() {
  const params = useParams<{ listId: string }>();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">List {params.listId}</div>
        <Button variant="outline" onClick={() => router.push("/app")}>
          Close
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        {/* TODO: afficher les items de la liste */}
        Placeholder content list
      </div>

      <Button
        variant="outline"
        onClick={() => router.push(`/app/lists/${params.listId}/items/123`)}
      >
        Go to item 123
      </Button>

      <p>
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quae, et quo labore dolorem
        eligendi nemo hic? Eos voluptate sunt nihil natus officiis neque aliquid similique error
        voluptas? Est harum quod explicabo, inventore assumenda numquam quibusdam ratione,
        accusantium ea dolorem quia nam totam iusto ducimus voluptatibus nihil earum tenetur
        quisquam error pariatur doloremque dolor aspernatur! Et quos incidunt temporibus eaque.
        Praesentium asperiores quisquam atque natus aliquid. Ipsam animi quisquam illum beatae
        maxime molestiae, libero in aperiam quod quis sapiente est. Modi nulla maiores facilis?
        Aliquid voluptatem magnam non fugiat, dolore saepe earum dignissimos facere iure nulla
        exercitationem ipsa. Quasi quo esse qui id reiciendis error illum illo, deleniti tempora
        facere expedita repellendus. Eaque ea provident illo at rerum quos officiis enim saepe sed
        quasi aspernatur, doloremque exercitationem est, dolore iste. Soluta possimus ullam deserunt
        nesciunt distinctio corrupti nihil, impedit facilis quidem minima dolorum optio modi
        repellat quis veniam tenetur fugit nisi officiis quia doloremque consequatur. Porro,
        mollitia maiores perferendis autem exercitationem deserunt voluptates dolor corrupti fugit
        vitae voluptas odit magnam numquam quibusdam inventore omnis tempore quaerat officia
        eligendi necessitatibus itaque. Aliquam sunt modi libero ad molestias animi dignissimos quos
        eveniet velit eius, eum assumenda aspernatur repudiandae dicta iusto illum unde corrupti
        delectus, excepturi placeat, facere laborum soluta eligendi. Et, qui. Maiores nostrum ut,
        explicabo quam nam delectus at laboriosam consequuntur illum, eligendi, animi nemo velit
        doloremque! Cumque architecto est sapiente nemo laudantium. Magnam velit nobis corporis
        quibusdam doloremque saepe dignissimos, minus deleniti amet praesentium itaque soluta porro
        ex eveniet aliquam impedit explicabo? Nihil pariatur voluptatem perferendis fuga sint
        perspiciatis sit expedita officiis quaerat nam corporis, incidunt voluptates similique
        voluptate ex, ducimus praesentium nemo in velit nesciunt hic! Et temporibus molestias
        quibusdam facilis doloremque deserunt pariatur ratione, sunt cupiditate consequuntur ipsam
        aspernatur harum saepe similique, id assumenda, voluptatem quod? Nostrum molestiae illum
        animi in beatae inventore facere at, accusamus eius, commodi soluta tempore eligendi id
        ratione. Ducimus reprehenderit minus iste at quis, hic vero eveniet illo, quam sapiente
        velit doloremque expedita? Iure recusandae est hic magnam, porro aut sequi repudiandae quas
        nobis nam explicabo aspernatur libero nulla, modi fuga quidem ipsum dolorum minima eveniet
        reiciendis eaque harum qui. Magni tenetur, perferendis obcaecati, asperiores animi
        aspernatur amet repudiandae at recusandae reiciendis corrupti non rerum? Ipsum totam at, ea
        ducimus alias consectetur aut fugit, veniam illum ratione officia reprehenderit! Quisquam
        quasi totam labore facere, numquam, nemo corrupti vel sint reprehenderit blanditiis quis
        nisi corporis libero hic velit, qui repudiandae odio eos maxime nesciunt quia autem. Iusto
        recusandae similique sed voluptate velit! Nostrum, aut iste accusamus tenetur aliquam
        deleniti voluptate libero commodi officia ab dicta delectus dolor id ex iure voluptatem
        eaque, ducimus magnam nihil. Incidunt laborum laboriosam veniam ducimus facilis id ea, modi
        magni numquam sapiente soluta rem officiis dolorum praesentium corrupti voluptates commodi
        porro? Rerum modi eum sint libero totam amet labore quam doloribus quia, eveniet fuga, minus
        nulla veritatis hic deserunt asperiores esse unde magni incidunt dolores, atque nihil? Quos
        tenetur sunt ullam voluptatibus et expedita vel. Minus fugit temporibus accusantium earum
        voluptatibus sint suscipit possimus velit praesentium sapiente illo quibusdam esse, soluta
        quasi dolor adipisci maxime aliquam, nemo quae hic quia ab. Ratione doloribus nostrum
        commodi repellendus sunt expedita, impedit quam maiores dolores hic saepe fuga, optio iure
        quo? Fugit voluptatum quibusdam nobis, aspernatur at nostrum accusantium, eos id modi ut
        delectus praesentium quaerat, necessitatibus aliquam illum dolor? Voluptate quis magnam
        placeat, laboriosam quas maiores quos facere porro iure laudantium explicabo sapiente
        corrupti assumenda optio dolore delectus modi velit aliquam. Quod animi tempora,
        consequuntur repellendus accusantium facilis laboriosam sapiente dolores reprehenderit
        dolorem, vero nihil maxime aspernatur deleniti a laudantium itaque non perspiciatis natus,
        nesciunt esse qui eveniet? Minima aperiam quisquam quia nihil beatae dolore, vel numquam
        quod? Excepturi praesentium est error accusamus ipsam quaerat ipsum obcaecati ratione
        sapiente, saepe magni tempore, deleniti totam laboriosam accusantium similique reiciendis
        perspiciatis sed doloremque natus assumenda culpa veniam tenetur modi? Alias similique
        ratione, magnam vel dolorem deserunt possimus nesciunt minima, sequi hic excepturi aperiam
        eaque, laudantium aliquam ab provident ea neque. Dolor recusandae voluptates deserunt, porro
        fugiat sequi labore commodi alias architecto consectetur quidem ipsum quis laborum quaerat
        fuga, rerum excepturi itaque ab possimus exercitationem sunt obcaecati. Fugit, suscipit
        placeat? Inventore, maiores perferendis. Inventore deserunt ad et dolores beatae. Facilis,
        aspernatur tenetur. Nisi accusantium magnam, fuga dolore assumenda fugit, suscipit minus
        dolorem neque quas eveniet voluptatum ab vel quos necessitatibus facilis commodi deleniti
        autem esse. Consequatur pariatur animi commodi asperiores odit ad maxime repellat nobis,
        error repellendus earum impedit! Nihil accusamus illum iusto in id repellendus ut dolorem
        blanditiis corporis saepe qui facilis odio quae corrupti, architecto sit laboriosam itaque
        ullam non ea delectus repudiandae magni fugiat. Rem laborum in quas accusamus beatae
        necessitatibus! Consequuntur provident, illo labore quasi impedit nulla! Quo explicabo, ipsa
        aspernatur tempora, quae id corporis animi aliquid totam pariatur fugiat nisi voluptate
        labore, molestias fugit! Ullam enim nihil ipsa aliquam illum fugit similique tempora, quae
        aliquid, sint, laudantium assumenda eos! Itaque minima veritatis impedit aspernatur eum.
        Fugit repellat vel, impedit exercitationem nemo consequuntur illo fuga officia eum.
        Laboriosam aspernatur ea magnam, ipsum ex mollitia veritatis corrupti repellendus cupiditate
        tenetur eos dolorum totam tempore corporis, expedita sunt, veniam qui! Culpa aspernatur rem
        odit. Illo officiis similique, nisi fugiat quod neque ducimus eligendi, fugit, officia
        distinctio reprehenderit vitae iure et cupiditate voluptatibus quo inventore ea? Quasi optio
        laudantium similique officiis, doloremque rem porro! Vitae eius accusamus quae accusantium
        ad! Eveniet aperiam assumenda provident enim sit pariatur consectetur hic reprehenderit
        tenetur delectus! Maxime explicabo, ea itaque quia, totam error aperiam architecto non enim
        sint omnis recusandae repellendus modi rerum debitis sunt et nostrum facilis quisquam vel?
        Maxime velit, iste consequatur, quod animi sunt totam porro molestias repellat perspiciatis
        minima quia saepe. Voluptatibus quod beatae suscipit eaque quia, consequuntur quisquam,
        tenetur, dolorum recusandae rerum aliquam. Architecto fugiat quam consectetur doloremque
        itaque repellat eaque aspernatur fugit ipsum? Voluptas rem totam iusto suscipit porro unde
        earum possimus modi ullam veniam id nisi ducimus labore animi hic, dolorum corrupti
        veritatis. Ea sint nesciunt enim saepe earum, obcaecati corporis!
      </p>
    </div>
  );
}
