import Pagination from '@/components/ui/pagination'
import { IProductAdvanced, useGetProducts } from '@/hooks/useGetProducts'
import { formatPrice } from '@/lib/utils'
import { deleteProduct } from '@/services/product'
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Button, Popconfirm, Space, Table, TableProps, message } from 'antd'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 10

const Product = () => {
    const navigate = useNavigate()

    const { data, currentPage, setCurrentPage, totalCount, isLoading, fetchData } = useGetProducts({ limit: PAGE_SIZE })

    const findImage = (data: IProductAdvanced['images']) => {
        return data?.find((item) => item?.type === 'thumbnail')
    }

    const findPrice = (data: IProductAdvanced['productDetails']) => {
        return data?.reduce((min, item) => (item?.price < min ? item?.price : min), data[0]?.price)
    }

    const findImportPrice = (data: IProductAdvanced['productDetails']) => {
        return data?.reduce((min, item) => (item?.importPrice < min ? item?.importPrice : min), data[0]?.importPrice)
    }

    function getLabelSizes(data: IProductAdvanced['productDetails']): string | null {
        if (Array(data) && data?.length !== 0) {
            const sizes = data?.map((item) => item?.size)
            return sizes?.join(', ')
        }
        return null
    }

    const findPromotionalPrice = (data: IProductAdvanced['productDetails']) => {
        return data?.reduce(
            (min, item) => (item?.promotionalPrice < min ? item?.promotionalPrice : min),
            data[0]?.promotionalPrice
        )
    }

    const confirmDelete = async (productId: string) => {
        try {
            const response = await deleteProduct(productId)
            if (response?.message) message.success(response.message)
            fetchData()
        } catch (error) {}
    }

    const cancelDelete = () => {
        message.error('Hủy xóa sản phẩm')
    }

    const navigateToDetail = (id: string) => {
        navigate(`/admin/products/detail/${id}`)
    }

    const navigateToEdit = (id: string) => {
        navigate(`/admin/products/edit/${id}`)
    }

    const navigateToAdd = () => {
        navigate('/admin/products/add')
    }

    const columns: TableProps<IProductAdvanced>['columns'] = [
        {
            title: '#',
            width: '2%'
        },
        {
            title: 'Ảnh',
            dataIndex: 'images',
            key: 'images',
            width: '10%',
            render: (value) => {
                const item = findImage(value)
                return <img src={item?.imageUrl} alt='Product' className='w-16 aspect-square object-cover shrink-0' />
            }
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            width: '15%'
        },
        {
            title: 'Danh mục',
            dataIndex: 'nameCategory',
            key: 'nameCategory',
            width: '10%'
        },
        {
            title: 'Size',
            dataIndex: 'productDetails',
            key: 'size',
            width: '10%',
            render: (value) => {
                return <p>{getLabelSizes(value)}</p>
            }
        },
        {
            title: 'Giá nhập',
            dataIndex: 'productDetails',
            key: 'importPrice',
            width: '10%',
            render: (value) => {
                if (value?.length == 0 || !findImportPrice(value)) return null
                return <p>{formatPrice(findImportPrice(value))}</p>
            }
        },
        {
            title: 'Giá niêm yiết',
            dataIndex: 'productDetails',
            key: 'price',
            width: '10%',
            render: (value) => {
                if (value?.length == 0 || !findPrice(value)) return null
                return <p>{formatPrice(findPrice(value))}</p>
            }
        },
        {
            title: 'Giá bán',
            dataIndex: 'productDetails',
            key: 'promotionalPrice',
            width: '10%',
            render: (value) => {
                if (value?.length == 0 || !findPromotionalPrice(value)) return null
                return <p>{formatPrice(findPromotionalPrice(value))}</p>
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            render: (status: string) => {
                const statusColor = status === 'Hiện' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'
                return <p className={statusColor}>{status}</p>
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '20%',
            render: (createdAt: Date) => <p>{dayjs(createdAt).format('HH:MM DD-MM-YYYY')}</p>
        },
        {
            title: 'Hành động',
            dataIndex: '',
            key: 'actions',
            width: '15%',
            render: (_, record) => (
                <Space size='middle'>
                    <Button onClick={() => navigateToDetail(record._id)}>
                        <InfoCircleOutlined style={{ display: 'inline-flex' }} />
                    </Button>
                    <Button onClick={() => navigateToEdit(record._id)}>
                        <EditOutlined style={{ display: 'inline-flex' }} />
                    </Button>
                    <Popconfirm
                        placement='topRight'
                        title='Xóa sản phẩm?'
                        description='Bạn có chắc chắn xóa sản phẩm này không?'
                        onConfirm={() => confirmDelete(record._id)}
                        onCancel={cancelDelete}
                        okText='Đồng ý'
                        cancelText='Không'
                    >
                        <Button danger>
                            <DeleteOutlined style={{ display: 'inline-flex' }} />
                        </Button>
                    </Popconfirm>
                </Space>
            )
        }
    ]

    return (
        <>
            <div className='flex justify-between items-center mx-[50px] my-4'>
                <div>
                    <p className='text-[26px] uppercase font-semibold'>Quản lí sản phẩm</p>
                </div>
                <div className='flex justify-end mb-2'>
                    <Button
                        type='primary'
                        icon={<PlusCircleOutlined />}
                        size={'large'}
                        className='bg-[#1677ff]'
                        onClick={navigateToAdd}
                    />
                </div>
            </div>

            <Table<IProductAdvanced>
                dataSource={data}
                // dataSource={isLoading ? [] : data}
                columns={columns}
                pagination={false}
                loading={isLoading}
            />
            {!isLoading && (
                <Pagination
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    pageSize={PAGE_SIZE}
                    totalCount={totalCount}
                />
            )}
        </>
    )
}

export default Product
