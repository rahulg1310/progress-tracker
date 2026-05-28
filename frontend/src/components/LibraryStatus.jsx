import React from 'react'

const LibraryStatus = (props) => {
  return (
    <div className='flex flex-col items-center'>
        <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-2`}
             style={{background : props.cg}}>
            <div className='w-14 h-14 rounded-full bg-[#111620] flex items-center justify-center'>
                <span className={`font-bold ${props.color2}`}>{props.num}</span>
            </div>
        </div>
        <span className='body text-[#4a5568] text-[13px]'>{props.status}</span>
    </div>
  )
}

export default LibraryStatus
