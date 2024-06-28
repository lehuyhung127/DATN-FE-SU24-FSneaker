import instance from '@/core/api'

export const getReviews = async () => {
    const response = await instance.get(`api/review/reviews`)
    const data = response.data
    return data
}

export const getReview = async (reviewId: string) => {
    const response = await instance.get(`api/review/reviews/${reviewId}`)
    const data = response.data
    return data
}
