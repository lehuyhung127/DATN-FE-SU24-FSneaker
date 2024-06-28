import { IOrder, IOrderStatus } from '@/common/interfaces/order'
import { IOderHistory } from '@/common/interfaces/product'
import Detail from '@/components/crud/detail'
import { ORDER_PAYMENT_NAMES, ORDER_PAYMENT_STATUS_NAMES, ORDER_STATUS_NAMES } from '@/constants/data'
import { formatPrice } from '@/lib/utils'
import { getOrder, getOrderHistory } from '@/services/order'
import { AntDesignOutlined } from '@ant-design/icons'
import {
    Avatar,
    Descriptions,
    DescriptionsProps,
    Form,
    Input,
    List,
    StepProps,
    Steps,
    Timeline,
    Typography
} from 'antd'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ClockCircleOutlined } from '@ant-design/icons'
import { subscribe } from 'diagnostics_channel'
import { X } from 'lucide-react'
interface FieldType {
    code: string
    createdAt: string
    updatedAt: string
    paymentType: string
    totalAmountPaid: string
    totalPrice: string
    orderStatus: string
    paymentStatus: string
    address: string
}

const OrderDetail = () => {
    const { orderId } = useParams()
    const [form] = Form.useForm()

    const [data, setData] = useState<IOrder>()

    const [history, setHistory] = useState<IOderHistory[]>([])

    const fetchOrder = async () => {
        const res = await getOrder(orderId)
        if (res?.data) {
            console.log(res.data)
            const data: IOrder = res.data
            setData(data)
            form.setFieldsValue({
                code: data.codeOrders,
                createdAt: data?.createdAt && dayjs(data.createdAt).format('HH:MM DD-MM-YYYY'),
                updatedAt: data?.updatedAt && dayjs(data.updatedAt).format('HH:MM DD-MM-YYYY'),
                paymentType: data?.paymentMethod && ORDER_PAYMENT_NAMES[data.paymentMethod],
                totalAmountPaid: data?.total_amount_paid && formatPrice(data.total_amount_paid),
                totalPrice: data?.total_price && formatPrice(data.total_price),
                orderStatus: data?.orderStatus && ORDER_STATUS_NAMES[data.orderStatus],
                paymentStatus: data?.paymentStatus && ORDER_PAYMENT_STATUS_NAMES[data.paymentStatus]
            })
        }
    }

    const fetchOrderHistory = async () => {
        const res = await getOrderHistory(orderId)

        if (res?.statusHistory) {
            const data: IOderHistory[] = res?.statusHistory
            setHistory(data?.reverse())
        }
    }

    useEffect(() => {
        fetchOrder()
    }, [])

    useEffect(() => {
        fetchOrderHistory()
    }, [])

    const items: DescriptionsProps['items'] = [
        {
            label: 'Khách hàng',
            children: data?.user_id?.userName
        },
        {
            label: 'Số điện thoại',
            children: data?.phone
        },
        {
            label: 'Địa chỉ',
            children: data?.address
        }
    ]

    const renderForm = () => {
        return (
            <>
                <Form form={form} layout='vertical'>
                    <Form.Item<FieldType> name='createdAt' label='Ngày tạo đơn'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Form.Item<FieldType> name='updatedAt' label='Ngày chỉnh sửa'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Form.Item<FieldType> name='paymentType' label='Hình thức thanh toán'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Form.Item<FieldType> name='totalAmountPaid' label='Tổng số tiền thanh toán'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Form.Item<FieldType> name='totalPrice' label='Tống số chi trả'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Form.Item<FieldType> name='orderStatus' label='Trạng thái'>
                        <Input readOnly disabled />
                    </Form.Item>
                    <Steps progressDot current={0} status={getStatus} items={steps} />
                    <br />
                    <br />
                    <Form.Item<FieldType> name='paymentStatus' label='Trạng thái thanh toán'>
                        <Input readOnly disabled />
                    </Form.Item>
                </Form>
                <Typography>Danh sách sản phẩm:</Typography>
                <List
                    itemLayout='horizontal'
                    dataSource={data?.productDetails}
                    renderItem={(item, index) => (
                        <List.Item extra={item.quantityOrders && `x${item.quantityOrders}`}>
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        src={item.image}
                                        size={{ xs: 24, sm: 32, md: 40, lg: 64, xl: 64, xxl: 64 }}
                                        icon={<AntDesignOutlined />}
                                    />
                                }
                                title={`${item.productName}` + (item.sizeName && ' (size ' + `${item.sizeName}` + ')')}
                                description={item?.price && formatPrice(item.price)}
                            />
                        </List.Item>
                    )}
                />
            </>
        )
    }

    const getStatus: StepProps['status'] = useMemo(() => {
        if (history?.length !== 0) {
            const statuses: Record<IOrderStatus, StepProps['status']> = {
                pending: 'process',
                waiting: 'wait',
                delivering: 'process',
                done: 'finish',
                cancel: 'error'
            }
            return statuses?.[history?.[0]?.status] ?? undefined
        }
        return undefined
    }, [history])

    const steps = useMemo(() => {
        return history?.map((item) => {
            return {
                title: ORDER_STATUS_NAMES[item.status],
                subTitle: item.adminName,
                description: dayjs(item?.timeStamp).format('HH:MM DD-MM-YYYY')
            }
        })
    }, [history])

    return (
        <Detail name='Đặt hàng'>
            <Descriptions
                column={{
                    xs: 1,
                    sm: 1,
                    md: 1,
                    lg: 3,
                    xl: 3,
                    xxl: 3
                }}
                title={`Chi tiết đơn hàng: ${data?.codeOrders ?? ''}`}
                items={items}
            />

            {renderForm()}
        </Detail>
    )
}

export default OrderDetail
