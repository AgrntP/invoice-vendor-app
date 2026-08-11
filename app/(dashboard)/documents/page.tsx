import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// export default async function Page() {
//   const cookieStore = await cookies()
//   const supabase = createClient(cookieStore)

//   const { data: todos } = await supabase.from('todos').select()

//   return (
//     <ul>
//       {todos?.map((todo) => (
//         <li key={todo.id}>{todo.name}</li>
//       ))}
//     </ul>
//   )
// }

export default function DocumentsPage() {
  return (
    <div>
      <h1>Documents</h1>
      <p>Store and access invoice-related documents.</p>
    </div>
  );
}

