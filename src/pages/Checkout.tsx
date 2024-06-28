import instance from '@/core/api'
import { Icon } from '@iconify/react'
import classNames from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

type Inputs = {
    name: string
    address: string
    phone: string
    payment_type: 'cod' | 'vnpay'
}

interface CartItem {
    idCart: string
    nameProduct: string
    price: number
    promotionalPrice: number
    totalQuantity: number
    size: number
    totalPrice: number
    imageProduct: string
    productId: string
    sizeId: string,
    productDetailId?: string
}

interface ICreateOrderBody {
    name: string
    address: string
    user_id: string
    phone: string
    productDetails: {
        productId: string
        price: number
        quantity: number
        sizeId: string
        image: string
    }[]
    total_price: number
    payment_type?: 'cod' | 'vnpay'
}

const getUserID = (): string => {
    const storedUser = localStorage.getItem('user')
    const user = storedUser ? JSON.parse(storedUser) : {}
    const userID = user?._id || ''
    return userID
}

const Checkout = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState<'CHECKOUT' | 'PAYMENT'>('CHECKOUT')
    const [cartList, setCartList] = useState<CartItem[]>([]);
    const queryParams = new URLSearchParams(location.search)
    const transactionStatus = queryParams.get('vnp_TransactionStatus')
    const txnRef = queryParams.get('vnp_TxnRef');

    const {
        register,
        handleSubmit,
        formState: { isValid }
    } = useForm<Inputs>()

    useEffect(() => {
        fetchData();
    }, []);
    const totalPrice = useMemo(() => {
        const totalPrice = cartList?.reduce((total, item) => {
            return (total += item.promotionalPrice * item.totalQuantity)
        }, 0)

        return totalPrice
    }, [cartList?.length])

    const convertCart = () => {
        const data = cartList.map((item) => {
            return {
                productId: item.productId,
                price: item.price,
                quantityOrders: item.totalQuantity,
                sizeId: item.sizeId,
                image: item.imageProduct,
                sizeName: `${item.size}`,
                productDetailId: item.productDetailId,
                productName: item.nameProduct,
                promotionalPrice: item.promotionalPrice
            }
        });
        return data
    }

    useEffect(() => {
        if (transactionStatus === '00') {
            // toast.success("Thanh toán thành công")
            // window.location.href = '/';
            const dataLocal = JSON.parse(localStorage.getItem("dataFormSelf")!);
            instance.post('http://localhost:8000/api/order/create-order', {
                name: dataLocal.name,
                address: dataLocal.address,
                phone: dataLocal.phone,
                user_id: getUserID(),
                productDetails: dataLocal.productDetails,
                codeOrders: txnRef,
                paymentMethod: 'vnpay',
                paymentStatus: 'unpaid'
            }).then(() => {
                console.log("RUNNING HERE");
                localStorage.removeItem("dataFormSelf");
                // toast.success('Đặt hàng thành công');
                window.location.href = "http://localhost:5173/orders"
            })
        }
    }, [transactionStatus])

    const fetchData = async () => {
        const response = await instance.get(`api/cart/${getUserID()}`)
        setCartList(response.data.data)
    }


    const onSubmit: SubmitHandler<Inputs> = async (data) => {
        if (step === 'CHECKOUT') return
        if (data.payment_type === 'vnpay') {
            try {
                localStorage.setItem("dataFormSelf", JSON.stringify({ name: data.name, address: data.address, phone: data.phone, productDetails: convertCart(), total_price: totalPrice }));
                const { data: response } = await instance.post(
                    'api/order/create-order-vnpay',
                    {
                        user_id: getUserID(),
                        total_price: totalPrice,
                    },
                    {
                        withCredentials: true // Đảm bảo thông tin đăng nhập được bao gồm trong yêu cầu
                    }
                )
                window.location.href = response.url // Redirect to the VNPAY URL
            } catch (error) {
                console.log('run herere ')
                console.error('Error creating payment URL:', error)
            }
        }

    }

    const handleCreateOrder = async (data: ICreateOrderBody) => {
        try {
            await instance.post('/api/order/create-order', data)
            await onDeleteAllCart()
            toast.success('Đặt hàng thành công')
            navigate('/')
        } catch (error) {
            toast.error('Đã có lỗi xảy ra, vui lòng thử lại sau')
        }
    }

    const onDeleteAllCart = async () => {
        const ids = cartList?.map((it) => it.idCart)
        try {
            await instance.delete(`api/cart/deteCart`, {
                data: { idCart: ids }
            })
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div className='my-[50px]'>
            <div className='max-w-screen-xl m-auto text-[20px]'>
                <div className='cart grid grid-cols-4 gap-5 my-5 mx-0'>
                    <div className='cart__content col-span-2'>
                        <div className='nav__link flex items-center gap-2 text-[18px]'>
                            <a href='' className='flex items-center gap-2'>
                                Giỏ hàng
                                <Icon className='text-gray-400 text-[18px]' icon='mingcute:right-line' />
                            </a>
                            <p
                                className={classNames('flex items-center gap-2', {
                                    'text-sky-500': step === 'CHECKOUT'
                                })}
                            >
                                Thông tin giao hàng
                                <Icon className='text-gray-400 text-[18px]' icon='mingcute:right-line' />
                            </p>
                            <p
                                className={classNames('flex items-center', {
                                    'text-gray-400': step === 'CHECKOUT',
                                    'text-sky-500': step === 'PAYMENT'
                                })}
                            >
                                Phương thức thanh toán
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div
                                className={classNames({
                                    hidden: step === 'PAYMENT'
                                })}
                            >
                                <h2 className='my-4 text-[20px] font-normal'>Thông tin giao hàng</h2>
                                <div className='pay__info'>
                                    <div className='flex items-center gap-4 mb-8'>
                                        <div className='img__pay w-[80px] h-[80px] rounded-md overflow-hidden'>
                                            <img src='https://picsum.photos/200/300' alt='' />
                                        </div>
                                        <div className='info__profile'>
                                            <p className='text-gray-600 text-[18px] flex gap-1'>
                                                <span>Bui Ngoc Son</span>
                                                <span>(buingocson@fsneaker.com)</span>
                                            </p>
                                            <button className='text-sky-600 text-[16px]'>Đăng xuất</button>
                                        </div>
                                    </div>

                                    <div className='form__profile'>
                                        <div>
                                            <div className='relative z-0 w-full mb-5 group border rounded'>
                                                <input
                                                    type='text'
                                                    className='block py-2.5 px-4 w-full text-sm text-gray-900 bg-transparent border-0 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer'
                                                    placeholder=''
                                                    {...register('name', {
                                                        required: true
                                                    })}
                                                />
                                                <label className='peer-focus:font-medium absolute px-3 text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 bg-white'>
                                                    Tên người nhận
                                                </label>
                                            </div>
                                            <div className='relative z-0 w-full mb-5 group border rounded'>
                                                <input
                                                    type='text'
                                                    className='block py-2.5 px-4 w-full text-sm text-gray-900 bg-transparent border-0 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer'
                                                    placeholder=''
                                                    {...register('phone', {
                                                        required: true
                                                    })}
                                                />
                                                <label className='peer-focus:font-medium absolute px-3 text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 bg-white'>
                                                    Số điện thoại
                                                </label>
                                            </div>
                                            <div className='relative z-0 w-full mb-5 group border rounded'>
                                                <input
                                                    type='text'
                                                    className='block py-2.5 px-4 w-full text-sm text-gray-900 bg-transparent border-0 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer'
                                                    placeholder=''
                                                    {...register('address', {
                                                        required: true
                                                    })}
                                                />
                                                <label className='peer-focus:font-medium absolute px-3 text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 bg-white'>
                                                    Địa chỉ
                                                </label>
                                            </div>
                                            <div className='pay__router flex justify-between items-center mt-4'>
                                                <Link to='/cart' className='text-sky-600 text-[18px]'>
                                                    Giỏ hàng
                                                </Link>
                                                <button
                                                    disabled={!isValid}
                                                    onClick={() => setStep('PAYMENT')}
                                                    type='button'
                                                    className={classNames(
                                                        'text-white bg-sky-700 px-5 py-3 rounded text-[18px]',
                                                        {
                                                            'opacity-50': !isValid
                                                        }
                                                    )}
                                                >
                                                    Tiếp tục đến phương thức thanh toán
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <hr className='mt-[50px]' />
                                <p className=' text-center text-[18px] text-gray-500 mt-3'>Powered by Haravan</p>
                            </div>

                            <div
                                className={classNames({
                                    hidden: step === 'CHECKOUT'
                                })}
                            >
                                <h2 className='mt-8 mb-5 text-[20px] font-normal'>Phương thức thanh toán</h2>
                                <div className='py-4 border-2 border-solid rounded '>
                                    <div className='flex items-center gap-2 pb-4 pl-4'>
                                        <input
                                            value={'cod'}
                                            type='radio'
                                            defaultChecked
                                            // onChange={(e) => {
                                            //     setPaymentMethod(e.target.value as 'cod')
                                            // }}
                                            {...register('payment_type')}
                                        />
                                        <img
                                            src='https://hstatic.net/0/0/global/design/seller/image/payment/cod.svg?v=6'
                                            alt=''
                                        />
                                        <p className='text-gray-500 text-[18px]'>Thanh toán khi giao hàng (COD)</p>
                                    </div>
                                    <hr />
                                    <div className='flex items-center gap-2 pt-4 pl-4'>
                                        <input
                                            type='radio'
                                            {...register('payment_type')}
                                            value={'vnpay'}
                                        // onChange={(e) => {
                                        //     setPaymentMethod(e.target.value as 'vnpay')
                                        // }}
                                        />
                                        <img
                                            src='https://hstatic.net/0/0/global/design/seller/image/payment/other.svg?v=6'
                                            alt=''
                                        />
                                        <p className='text-gray-500 text-[18px]'>Chuyển khoản ngân hàng</p>
                                    </div>
                                </div>

                                <div className='pay__info'>
                                    <div className='form__profile'>
                                        <div className='flex items-center justify-between mt-4 pay__router'>
                                            <Link to='/cart' className='text-sky-600 text-[18px]'>
                                                Giỏ hàng
                                            </Link>
                                            <button
                                                type='submit'
                                                className='text-white bg-sky-700 px-5 py-3 rounded text-[18px]'
                                            >
                                                Hoàn tất đơn hàng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <hr className='mt-[50px]' />
                                <p className=' text-center text-[18px] text-gray-500 mt-3'>Powered by Haravan</p>
                            </div>
                        </form>
                    </div>

                    <div className='cart__info border-l border-slate-400 col-span-2 '>
                        {cartList?.map((it, index) => (
                            <div className='desc flex gap-4 items-center ml-8 relative mb-6' key={index}>
                                <div className='oder--item-img w-[100px] h-[100px] overflow-hidden'>
                                    <img
                                        src={it.imageProduct}
                                        alt=''
                                        className='imgfluid rounded-lg'
                                    />
                                    <p className='absolute bottom-[80px] left-[80px] bg-gray-200 border border-solid border-slate-400 rounded-full flex justify-center text-[16px] px-3 py-1'>
                                        {it.totalQuantity}
                                    </p>
                                </div>
                                <div className='item-desc-inf flex justify-between items-center gap-8 flex-1'>
                                    <div>
                                        <p className='desc-inf-title text-[15px]'>{it.nameProduct}</p>
                                        <p className='mb-4 text-[16px] font-normal text-gray-500'>{it.size}</p>
                                    </div>
                                    <p className='text-gray-600 font-medium text-[16px] ml-auto'>
                                        {it.price * it.totalQuantity}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <hr className='mt-4 border-dashed mx-4' />
                        <div className='pay__provisional mx-4 mt-4'>
                            <div className='payy__provisional--money flex justify-between mb-3'>
                                <p className='text-[18px] text-gray-500'>Tạm tính</p>
                                <p className='text-[18px] text-gray-500'>{totalPrice}</p>
                            </div>
                            <div className='payy__provisional--transport flex justify-between'>
                                <p className='text-[18px] text-gray-500'>Phí vận chuyển</p>
                                <p className='text-[18px] text-gray-500'>
                                    <Icon icon='bi:dash' />
                                </p>
                            </div>
                        </div>
                        <hr className='mt-4 border-dashed mx-4' />
                        <div className='payy__provisional--total flex justify-between mx-4 mt-4'>
                            <p className='text-[18px] text-gray-500'>Tổng cộng</p>
                            <p>
                                <span className='text-[16px] text-gray-500 mr-2'>VNĐ</span> {totalPrice}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
