import React from 'react'

const CompareModal = (props) => {
  const rows = [
    { label : 'Match', render : (rec)=><span className='mono text-[#00f5a0]'>{rec.match}%</span> },
    { label : 'Genres', render : (rec)=>rec.genres.join(', ') },
    { label : 'Length', render : (rec)=>`~${rec.estHours}h (estimate)` },
    { label : 'Released', render : (rec)=>rec.released },
    { label : 'Platforms', render : (rec)=>rec.platforms.join(', ') },
    { label : 'Why it fits', render : (rec)=>(
      <ul className='flex flex-col gap-1'>
        {rec.reasons.map(function(elem,idx){
          return <li key={idx}>· {elem}</li>
        })}
      </ul>
    ) },
  ];

  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-start md:items-center px-4 md:px-8 pt-12 py-4 z-50 overflow-auto'>
      <div className='bg-[#111820] max-w-4xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-4 p-6'>
        <div className='flex justify-between items-center'>
          <h1 className='font-bold text-xl tracking-wider'>Compare Games</h1>
          <button
          onClick={()=>{
            props.setCompareModal(false);
          }}
          className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
        </div>
        <div className='md:hidden flex flex-col gap-3'>
          {props.recs.map(function(elem){
            return (
              <div key={elem._id} className='bg-[#0d1117] border border-white/5 rounded-xl p-4 flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='w-3 h-3 rounded-full shrink-0' style={{backgroundColor : elem.colorAccent}}></span>
                  <span className='font-bold text-lg tracking-wider'>{elem.title}</span>
                </div>
                {rows.map(function(row){
                  return (
                    <div key={row.label} className='flex flex-col gap-0.5'>
                      <span className='body text-[11px] text-[#4a5568] font-semibold'>{row.label}</span>
                      <div className='body text-[13px]'>{row.render(elem)}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className='hidden md:block overflow-x-auto'>
          <table className='w-full min-w-[560px] border-collapse'>
            <thead>
              <tr>
                <th className='w-28'></th>
                {props.recs.map(function(elem){
                  return (
                    <th key={elem._id} className='text-left px-3 pb-3'>
                      <div className='flex items-center gap-2'>
                        <span className='w-3 h-3 rounded-full shrink-0' style={{backgroundColor : elem.colorAccent}}></span>
                        <span className='font-bold text-lg tracking-wider'>{elem.title}</span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(function(row){
                return (
                  <tr key={row.label} className='border-t border-t-gray-600/40'>
                    <td className='body text-[12px] text-[#4a5568] font-semibold py-3 pr-3 align-top'>{row.label}</td>
                    {props.recs.map(function(elem){
                      return <td key={elem._id} className='body text-[13px] px-3 py-3 align-top'>{row.render(elem)}</td>
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className='body text-[11px] text-[#4a5568]'>Lengths are rough estimates and vary with playstyle.</p>
      </div>
    </div>
  )
}

export default CompareModal
