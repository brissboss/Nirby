"use client";

import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export default function ListPage() {
  const { id } = useParams();
  const router = useRouter();

  return (
    <div
      className="p-4 overflow-y-auto max-h-[calc(100vh-2rem)] mt-4 md:mt-0"
      style={{ paddingBottom: "calc(1rem + env(safe-area-inset-top))" }}
    >
      <h1 className="text-2xl font-bold">List {id}</h1>
      <Button onClick={() => router.push("/")}>Back</Button>
      <p className="text-sm text-gray-700">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Adipisci eos, nesciunt obcaecati
        iste, placeat eligendi vitae, dolorem sunt laborum at laudantium minus deserunt ducimus
        provident libero nam voluptas labore ad doloribus. Cupiditate, vel aspernatur sed excepturi
        sint fugit deserunt repudiandae nostrum cumque neque quisquam distinctio minus aut, dolores,
        omnis facilis perferendis accusamus corrupti at nam aliquam ratione! Hic, enim! Sequi,
        porro. Quis eos ad quibusdam debitis obcaecati inventore tempora voluptatem provident quae
        at perferendis pariatur, nesciunt nemo, ut tenetur officiis nulla labore blanditiis
        corrupti, suscipit fugiat error! Non nemo a possimus repellat, sequi esse eius pariatur
        corrupti quisquam, voluptatem ab. Lorem ipsum dolor sit amet consectetur adipisicing elit.
        Quis a, magni exercitationem harum rem quod consequuntur praesentium cupiditate tenetur
        perspiciatis ullam quam maxime pariatur blanditiis modi ea. Laudantium asperiores officia
        nam ipsam quod, architecto, quam velit veniam ut distinctio iste aspernatur. Voluptas,
        expedita voluptate sint, beatae optio quasi sit eligendi quos obcaecati quidem eos minima
        veritatis laudantium architecto modi quis fuga maxime! Exercitationem accusamus aperiam quis
        quisquam placeat sint itaque quaerat et facilis delectus soluta quia modi, ullam ea eos iure
        voluptatum consectetur. Ullam voluptatem officiis sint, inventore quisquam deleniti minus
        obcaecati? Illum, ad! Aliquid aliquam a aperiam iste perferendis?
      </p>
    </div>
  );
}
