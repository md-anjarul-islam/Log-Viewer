import { useEffect } from 'react'
import { useCategoriesStore } from '../store/categoriesStore'

export function useCategories(): void {
  useEffect(() => {
    useCategoriesStore.getState().load()
    const unsubscribe = window.api.categories.onChanged((categories) => {
      useCategoriesStore.setState({ categories })
    })
    return unsubscribe
  }, [])
}
