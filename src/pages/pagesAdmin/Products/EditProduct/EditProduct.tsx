import { ArrowLeftOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import {
    Breadcrumb,
    Button,
    Card,
    Checkbox,
    Col,
    ColProps,
    Form,
    FormInstance,
    FormListFieldData,
    FormProps,
    Input,
    Row,
    Select,
    Upload,
    UploadFile,
    UploadProps,
    message
} from 'antd'
import { CheckboxChangeEvent, CheckboxOptionType } from 'antd/es/checkbox'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ICategory } from '@/common/interfaces/category'
import { IImageType } from '@/common/interfaces/common'
import { IAddImageBody, IImage } from '@/common/interfaces/image'
import { IProduct } from '@/common/interfaces/product'
import { ISize } from '@/common/interfaces/size'
import { STATUS_PRODUCT } from '@/constants/data'
import { getCategorys } from '@/services/category'
import { addImageProduct, deleteImageProduct, getAllImageProductById } from '@/services/image'
import { getInfoProduct } from '@/services/infoProduct'
import { getProduct, updateProduct } from '@/services/product'
import { addProductDetail, deleteProductDetail, updateProductDetail } from '@/services/productDetail'
import { getSizes } from '@/services/size'
import { FileType, getBase64 } from '@/utils/common'

type UploadImageStatus = 'removed' | 'added'

interface ImageInfo extends UploadFile {
    ref?: {
        status?: UploadImageStatus
    } & IImage
}

interface FieldType {
    name: string
    description: string
    status: string
    category: string
    thumbnail: UploadFile[]
    gallery: UploadFile[]
    sizes: {
        label?: string
        value?: string
        importPrice: string
        price?: string
        promotionalPrice: string
        quantity: string
        sizes?: string
    }[]
    checkedItems?: string[]
}

const uploadProps: UploadProps = {
    multiple: true,
    showUploadList: {
        showPreviewIcon: false
    },
    accept: 'image/png, image/jpeg, image/jpg',
    listType: 'picture-card',
    beforeUpload: () => false
}

const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type='button'>
        <PlusOutlined />
        <div style={{ marginTop: 8 }}>Upload</div>
    </button>
)

const normFile = (e: any) => {
    if (Array.isArray(e)) {
        return e
    }
    return e?.fileList
}

// __SCREEN__

const EditProduct = () => {
    // hooks
    const [form] = Form.useForm()
    const { productId } = useParams()
    const navigate = useNavigate()

    // states
    const [categories, setCategories] = useState<ICategory[]>([])
    const [sizes, setSizes] = useState<ISize[]>([])

    const [infoPersisted, setInfoPersisted] = useState([])

    const [fileListThumb, setFileListThumb] = useState<ImageInfo[]>([])
    const [fileListGallery, setFileListGallery] = useState<ImageInfo[]>([])
    const [imgIdsDelete, setImgIdsDelete] = useState<string[]>([])

    const fetchProduct = async () => {
        const product: IProduct = await getProduct(productId)

        if (product) {
            form.setFieldsValue({
                name: product?.name,
                description: product?.description,
                status: product?.status,
                category: product?.categoryId?._id
            })
        }
    }

    const fetchCategories = async () => {
        const res = await getCategorys()
        const data = res.data
        setCategories(data)
    }

    const fetchInfoProduct = async () => {
        const infoProductResponse = await getInfoProduct(productId)
        const sizesResponse = await getSizes()
        const sizeData = sizesResponse.data
        const infoData = infoProductResponse?.data?.productDetails

        setSizes(sizeData)

        form.setFieldValue(
            'sizes',

            infoData?.map((e) => {
                return { ...e, _sizeIdKey: e.sizeId } // size
            })
        )

        setInfoPersisted(infoData)

        const sizeIds = [...infoData].map((item) => {
            return item.sizeId
        })

        form.setFieldValue('checkedItems', sizeIds)
    }

    const fetchImages = async () => {
        const res = await getAllImageProductById(productId as string)
        const data: IImage[] = res?.data?.arrImageProduct

        if (data) {
            const thumbData = data.filter((e) => e.type === 'thumbnail')
            const galleryData = data.filter((e) => e.type === 'gallery')

            const newThumbData: ImageInfo[] = thumbData?.map((e) => {
                return {
                    name: e._id,
                    uid: e._id,
                    url: e.image,
                    ref: {
                        ...e
                    }
                }
            })

            const newGalleryData: ImageInfo[] = galleryData?.map((e) => {
                return {
                    name: e._id,
                    uid: e._id,
                    url: e.image,
                    ref: {
                        ...e
                    }
                }
            })

            setFileListThumb(newThumbData)
            setFileListGallery(newGalleryData)
        }
    }

    useEffect(() => {
        fetchProduct()
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchImages()
    }, [])

    useEffect(() => {
        fetchInfoProduct()
    }, [])

    const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
        const allImage = [...fileListThumb, ...fileListGallery].filter((e) => e.ref?.status === 'added')

        const allImageAdded = allImage.map((e) => {
            return {
                productId,
                image: e.url,
                type: e.ref?.type
            }
        }) as IAddImageBody[]

        // input của product
        const productInput = {
            name: values.name,
            description: values.description,
            status: values.status,
            categoryId: values.category
        }

        const editedProductDetail: any[] = values?.sizes
        const originaProductDetail: any[] = infoPersisted

        const createProductDetailInput = editedProductDetail
            ?.filter((edited) => !originaProductDetail?.some((original) => original?.sizeId === edited?._sizeIdKey))
            ?.map((item) => {
                return {
                    quantity: Number(item.quantity),
                    price: Number(item.price),
                    importPrice: Number(item.importPrice),
                    promotionalPrice: Number(item.promotionalPrice),
                    product: productId,
                    sizes: item?._sizeIdKey
                }
            })

        const updateProductDetailInput = editedProductDetail
            ?.filter((edit) => originaProductDetail?.some((original) => original?.sizeId === edit?._sizeIdKey))
            ?.map((item) => {
                return {
                    productDetailId: item.productDetailId,
                    sizes: [
                        {
                            _id: item.sizeId,
                            quantity: Number(item.quantity),
                            price: Number(item.price),
                            importPrice: Number(item.importPrice),
                            promotionalPrice: Number(item.promotionalPrice)
                        }
                    ]
                }
            })

        const deleteProductDetailInput: string[] | [] = originaProductDetail
            ?.filter((original) => !editedProductDetail?.some((edited) => edited?._sizeIdKey === original?.sizeId))
            ?.map((item) => item?.productDetailId)

        const results = await Promise.allSettled([
            // 1
            updateProduct(productId, productInput),
            // 2
            allImageAdded?.length !== 0 ? addImageProduct(allImageAdded) : Promise.resolve(),
            // 3
            imgIdsDelete?.length !== 0 ? deleteImageProduct(imgIdsDelete) : Promise.resolve(),
            // 4
            createProductDetailInput?.length !== 0 ? addProductDetail(createProductDetailInput) : Promise.resolve(),
            // 5
            updateProductDetailInput?.length !== 0 ? updateProductDetail(updateProductDetailInput) : Promise.resolve(),
            // 6
            deleteProductDetailInput?.length !== 0
                ? deleteProductDetailInput.map((e) => deleteProductDetail(e))
                : Promise.resolve()
        ])

        const updateProduct_Promise = results[0]
        const addedImages_Promise = results[1]
        const deleteImages_Promise = results[2]
        const createProductDetail_Promise = results[3]
        const updateProductDetail_Promise = results[4]
        const deleteProductDetail_Promise = results[5]

        // promise 1
        if (updateProduct_Promise.status === 'rejected') {
            updateProduct_Promise?.reason?.message && message.error(updateProduct_Promise.reason.message)
        }
        if (results[0].status === 'fulfilled') {
            // message.success('Cập nhật sản phẩm thành công')
        }

        // promise 2
        if (addedImages_Promise.status === 'rejected') {
            addedImages_Promise?.reason?.message && message.error(addedImages_Promise.reason.message)
        }
        if (addedImages_Promise.status === 'fulfilled' && addedImages_Promise?.value) {
            // message.success('Thêm 1 số ảnh sản phẩm thành công')
        }

        // promise 3
        if (deleteImages_Promise.status === 'rejected') {
            deleteImages_Promise?.reason?.message && message.error(deleteImages_Promise.reason.message)
        }
        if (deleteImages_Promise.status === 'fulfilled' && deleteImages_Promise?.value) {
            // message.success('Xoá 1 số ảnh sản phẩm thành công')
        }

        // promise 4
        if (createProductDetail_Promise.status === 'rejected') {
            createProductDetail_Promise?.reason?.message && message.error(createProductDetail_Promise.reason.message)
        }
        if (createProductDetail_Promise.status === 'fulfilled' && createProductDetail_Promise?.value) {
            // message.success('Thêm chi tiết sản phẩm thành công')
        }

        // promise 5
        if (updateProductDetail_Promise.status === 'rejected') {
            updateProductDetail_Promise?.reason?.message && message.error(updateProductDetail_Promise.reason.message)
        }
        if (updateProductDetail_Promise.status === 'fulfilled' && updateProductDetail_Promise?.value) {
            // message.success('Cập nhật chi tiết sản phẩm thành công')
        }

        // promise 6
        if (deleteProductDetail_Promise.status === 'rejected') {
        }
        if (deleteProductDetail_Promise.status === 'fulfilled' && deleteProductDetail_Promise?.value) {
            //
        }

        fetchImages()
        fetchInfoProduct()
    }

    const onFinishFailed = () => {
        message.error('Thiếu thông tin sản phẩm')
    }

    const onSubmitForm = () => {
        form.submit()
    }

    const onChangeUpload = async (
        file: ImageInfo,
        list: ImageInfo[],
        setList: Dispatch<SetStateAction<ImageInfo[]>>,
        type: IImageType
    ) => {
        if (!file.status) {
            console.log(file)
            const imgBase64 = await getBase64(file as FileType)
            file = {
                url: imgBase64,
                ...file,
                ref: {
                    ...file.ref,
                    status: 'added',
                    type
                }
            } as ImageInfo

            const newData = [...list, file]
            setList(newData)
            return
        }
        if (file?.status === 'removed' && !file?.ref?.status) {
            const imgId = file?.ref?._id as string

            const imgIds = [...imgIdsDelete, imgId]
            setImgIdsDelete(imgIds)
        }

        const newData = [...list]
        setList(newData.filter((e) => e.uid !== file.uid))
    }

    const options: CheckboxOptionType<string>[] = sizes?.map((e) => {
        return {
            label: e.size,
            value: e._id
        }
    })

    const colProps: ColProps = {
        xs: 24,
        sm: 24,
        md: 12,
        lg: 8,
        xl: 6,
        xxl: 6
    }

    const onChangeCheckbox = (e: CheckboxChangeEvent, option: CheckboxOptionType<string>) => {
        const index = options?.findIndex((item) => item.value === e.target.value)

        if (e.target.checked) {
            const list: any[] = form.getFieldValue('sizes') ?? []
            const newList = [...list]
            newList.splice(index, 0, {
                _sizeIdKey: option.value
            })
            form.setFieldValue('sizes', newList)
        } else {
            const list = form.getFieldValue('sizes') ?? []
            const filteredList = list.filter((item: any) => item._sizeIdKey !== option.value)
            form.setFieldValue('sizes', filteredList)
        }
    }

    const validateImportPrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const price = getFieldValue(['sizes', field.name, 'price'])
            const promotionalPrice = getFieldValue(['sizes', field.name, 'promotionalPrice'])

            if (value !== undefined) {
                if (price !== undefined && Number(value) >= Number(price)) {
                    return Promise.reject(new Error('Giá nhập phải nhỏ hơn Giá niêm yết'))
                }
                if (promotionalPrice !== undefined && Number(value) >= Number(promotionalPrice)) {
                    return Promise.reject(new Error('Giá nhập phải nhỏ hơn Giá bán'))
                }
            }

            return Promise.resolve()
        }

    const validatePrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const importPrice = getFieldValue(['sizes', field.name, 'importPrice'])
            const promotionalPrice = getFieldValue(['sizes', field.name, 'promotionalPrice'])

            if (value !== undefined) {
                if (importPrice !== undefined && Number(value) <= Number(importPrice)) {
                    return Promise.reject(new Error('Giá niêm yết phải lớn hơn Giá nhập'))
                }
                if (promotionalPrice !== undefined && Number(value) < Number(promotionalPrice)) {
                    return Promise.reject(new Error('Giá niêm yết phải lớn hơn Giá bán'))
                }
            }

            return Promise.resolve()
        }

    const validatePromotionalPrice =
        (getFieldValue: FormInstance['getFieldValue'], field: FormListFieldData) => (_: any, value: any) => {
            const importPrice = getFieldValue(['sizes', field.name, 'importPrice'])
            const price = getFieldValue(['sizes', field.name, 'price'])

            if (value !== undefined) {
                if (importPrice !== undefined && Number(value) <= Number(importPrice)) {
                    console.log('2')
                    return Promise.reject(new Error('Giá bán phải lớn hơn Giá nhập'))
                }
                if (price !== undefined && Number(value) > Number(price)) {
                    console.log(price)
                    return Promise.reject(new Error('Giá bán phải lớn hơn Giá niêm yết'))
                }
            }

            return Promise.resolve()
        }

    const goBack = () => {
        navigate('/admin/products')
    }

    return (
        <div className='border p-6'>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Col>
                    <Breadcrumb
                        items={[
                            {
                                title: <a href='/admin/products'>Quản lý sản phẩm</a>
                            },
                            {
                                title: 'Sửa'
                            }
                        ]}
                    />
                    <Button type='text' size='large' icon={<ArrowLeftOutlined />} onClick={goBack}>
                        Sửa sản phẩm
                    </Button>
                </Col>
                <div>
                    <Button
                        type='primary'
                        icon={<SaveOutlined />}
                        size='large'
                        className='bg-[#1677ff]'
                        onClick={onSubmitForm}
                    >
                        Save
                    </Button>
                </div>
            </div>

            <Form form={form} layout='vertical' onFinish={onFinish} onFinishFailed={onFinishFailed} autoComplete='off'>
                <Form.Item<FieldType>
                    name='name'
                    label='Tên sản phẩm'
                    rules={[{ required: true, message: 'Tên quá ngắn', min: 6 }]}
                >
                    <Input placeholder='Nhập tên sản phẩm' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='description'
                    label='Mô tả sản phẩm'
                    rules={[{ required: true, message: 'Vui lòng nhập' }]}
                >
                    <Input.TextArea placeholder='Nhập mô tả...' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='status'
                    label='Trạng thái sản phẩm'
                    rules={[{ required: true, message: 'Vui lòng chọn' }]}
                >
                    <Select options={STATUS_PRODUCT} placeholder='Vui lòng chọn' />
                </Form.Item>
                <Form.Item<FieldType>
                    name='category'
                    label='Danh mục'
                    rules={[{ required: true, message: 'Vui lòng chọn' }]}
                >
                    <Select
                        fieldNames={{
                            label: 'name',
                            value: '_id'
                        }}
                        placeholder='Vui lòng chọn'
                        options={categories}
                    />
                </Form.Item>
                <Form.Item<FieldType>
                    name='thumbnail'
                    label='Ảnh đại diện'
                    valuePropName='fileList'
                    getValueFromEvent={normFile}

                    // rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
                >
                    <Upload
                        {...uploadProps}
                        multiple={false}
                        maxCount={1}
                        fileList={fileListThumb}
                        onChange={({ file }) => {
                            onChangeUpload(file, fileListThumb, setFileListThumb, 'thumbnail')
                        }}
                    >
                        {fileListThumb?.length === 0 && uploadButton}
                    </Upload>
                    <br />
                </Form.Item>
                <Form.Item<FieldType>
                    name='gallery'
                    label='Ảnh gallery'
                    valuePropName='fileList'
                    getValueFromEvent={normFile}
                    // rules={[{ required: true, message: 'Vui lòng chọn ảnh' }]}
                >
                    <Upload
                        {...uploadProps}
                        fileList={fileListGallery}
                        onChange={({ file }) => {
                            onChangeUpload(file, fileListGallery, setFileListGallery, 'gallery')
                        }}
                    >
                        {uploadButton}
                    </Upload>
                    <br />
                </Form.Item>
                <Form.Item<FieldType> name='checkedItems' label='Danh sách size'>
                    <Checkbox.Group>
                        {options.map((option) => {
                            return (
                                <Checkbox
                                    key={option.value}
                                    onChange={(e) => onChangeCheckbox(e, option)}
                                    value={option.value}
                                >
                                    {option.label}
                                </Checkbox>
                            )
                        })}
                    </Checkbox.Group>
                </Form.Item>
                <Form.List name='sizes'>
                    {(fields) => (
                        <div style={{ display: 'flex', rowGap: 12, flexDirection: 'column' }}>
                            {fields.map((field) => (
                                <Card
                                    size='small'
                                    title={`Size: ${options.find(
                                        (e) => e.value === form.getFieldValue(['sizes', field.name, '_sizeIdKey'])
                                    )?.label}`}
                                    key={field.key}
                                >
                                    <Row gutter={16}>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá nhập'
                                                name={[field.name, 'importPrice']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập' },
                                                    { validator: validateImportPrice(form.getFieldValue, field) }
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá nhập' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá niêm yiết'
                                                name={[field.name, 'price']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập' },
                                                    { validator: validatePrice(form.getFieldValue, field) }
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá niêm yiết' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Giá bán'
                                                name={[field.name, 'promotionalPrice']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập' },
                                                    { validator: validatePromotionalPrice(form.getFieldValue, field) }
                                                ]}
                                                validateFirst
                                            >
                                                <Input type='number' min={1} placeholder='Giá bán' />
                                            </Form.Item>
                                        </Col>
                                        <Col {...colProps}>
                                            <Form.Item
                                                label='Số lượng'
                                                name={[field.name, 'quantity']}
                                                rules={[{ required: true, message: 'Vui lòng nhập' }]}
                                            >
                                                <Input type='number' min={1} placeholder='Số lượng' />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </div>
                    )}
                </Form.List>
            </Form>
        </div>
    )
}

export default EditProduct
