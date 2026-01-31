import { createClient } from '@/lib/supabase/server'
import { IntakeForm } from '@/components/engagements/intake-form'

export default async function NewEngagementPage() {
  const supabase = await createClient()

  // Fetch clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })

  return <IntakeForm clients={clients || []} />
}
