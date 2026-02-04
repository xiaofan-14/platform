"use server"

import { getUser } from "@/app/lib/session";

export default async function Home() {
  const user = await getUser();

  return (<div>
    首页
    <div>
      会话 session 中的用户信息 
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  </div>);
}
