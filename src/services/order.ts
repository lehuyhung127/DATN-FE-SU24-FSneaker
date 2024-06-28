import { IOrderStatus, IPaymentStatus } from '@/common/interfaces/order'
import instance from '@/core/api'

export interface GetOrdersParams {
    status: IOrderStatus[]
}

export const getOrders = async (params?: GetOrdersParams) => {
    const response = await instance.get('api/order/orders', {
        params
    })
    return response.data
}

export const getOrder = async (orderId: string) => {
    const response = await instance.get(`api/order/orders/${orderId}`)
    return response.data
}

export interface UpdateOrderBody {
    orderStatus?: IOrderStatus
    paymentStatus?: IPaymentStatus
}

export const updateOrder = async (orderId: string, order: UpdateOrderBody) => {
    const response = await instance.patch(`api/order/update-order/${orderId}`, order)
    return response.data
}

export const getOrderHistory = async (orderId: string) => {
    const response = await instance.get(`api/order/order-history/${orderId}`)
    return response.data
}
