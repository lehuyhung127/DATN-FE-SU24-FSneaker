import instance from '@/core/api'
import { ICategory } from './types'
import { IFCATEGORY_DETAIL } from '@/types/category'

export const getAllCategory = async (): Promise<ICategory[]> => {
    const { data } = await instance.get('/api/categories')
    return data.data
}

export const getCategory = async (_id: string): Promise<ICategory> => {
    const { data } = await instance.get(`/api/categories/${_id}`)
    return data.data
}
export const getCategoryDetails = async (id: string): Promise<IFCATEGORY_DETAIL[]> => {
    const { data } = await instance.get(`/api/infoProduct?category=${id}`)
    return data.data
}
export const filterCategoryByPrice = async (
    id: string,
    min: number = 0,
    max: number = 200
): Promise<IFCATEGORY_DETAIL[]> => {
    const { data } = await instance.get(`/api/infoProduct?category=${id}&minPrice=${min}&maxPrice=${max}`)
    return data.data
}