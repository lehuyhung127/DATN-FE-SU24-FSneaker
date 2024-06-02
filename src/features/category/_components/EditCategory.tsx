
import { useParams } from 'react-router-dom'
import FormCategory from './FormCategory'
import { useCategoryQuery } from '@/hooks/useAdmCategoryQuery.ts';
// import FormSlug from './FormSlug'

const EditCategory = () => {
    const { id } = useParams()
    const { data } = useCategoryQuery(id);
    console.log('data - ', data)
    return (
        <div>
            <div className='grid grid-cols-2'>
                <div>
                    <FormCategory data={data} />
                </div>
                {/* <div>
                    <FormSlug data={data} />
                </div> */}
            </div>
        </div>
    )
}

export default EditCategory