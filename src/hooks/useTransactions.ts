import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Transaction, NewTransaction } from '@/types/database.types'

const supabase = createClient()

export function useTransactions() {
  const queryClient = useQueryClient()

  // Fetch transactions
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .order('date', { ascending: false })

      if (error) throw error
      return data as (Transaction & { categories: any })[]
    },
  })

  // Add transaction with Optimistic Update
  const addTransactionMutation = useMutation({
    mutationFn: async (newTransaction: NewTransaction) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single()

      if (error) throw error
      return data
    },
    // Optimistic Update logic
    onMutate: async (newTransaction) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['transactions'] })

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(['transactions'])

      // Optimistically update to the new value
      queryClient.setQueryData(['transactions'], (old: any) => [
        {
          ...newTransaction,
          id: 'temp-id-' + Date.now(),
          created_at: new Date().toISOString(),
          // We might not have category details here, but UI should handle it
        },
        ...(old || []),
      ])

      // Return a context object with the snapshotted value
      return { previousTransactions }
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newTransaction, context: any) => {
      queryClient.setQueryData(['transactions'], context.previousTransactions)
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })

  return {
    transactions: transactionsQuery.data ?? [],
    isLoading: transactionsQuery.isLoading,
    isError: transactionsQuery.isError,
    addTransaction: addTransactionMutation.mutate,
    isAdding: addTransactionMutation.isPending,
  }
}
