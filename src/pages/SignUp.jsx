import React from 'react'
import { Gamepad2 } from 'lucide-react'

const SignUp = () => {
  return (
    <div className='min-h-screen w-full bg-[#080c10] flex justify-center items-center px-4'>
      <div className='bg-[#111820] flex flex-col gap-5 py-8 px-8     rounded-2xl border border-white/15 items-center w-full max-w-110'>
        <div className='flex items-center'>
            <Gamepad2 size={38} className='mr-3'/>
            <h1 className='font-bold bg-linear-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent text-3xl tracking-wider'>QUESTLOG</h1>
        </div>
        <div className='flex flex-col justify-center gap-3 items-center'>
            <h1 className='font-bold text-2xl tracking-normal'>Create account</h1>
            <h2 className='body text-xs text-[#8a9bb0]'>Start tracking your gaming journey</h2>
        </div>
        <div className='flex flex-col w-full items-start'>
            <form action="" className='w-full'>
                <span className='body text-[13px] text-[#8a9bb0]'>Username</span>
                <input type="text" name="" id="" placeholder='TheRadBrad' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 mb-5 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                <span className='body text-[13px] text-[#8a9bb0]'>Email</span>
                <input type="email" name="" id="" placeholder='user@example.com'
                autoComplete="email" className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 mb-5 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                <span className='body text-[13px] text-[#8a9bb0]'>Password</span>
                <input type="password" name="" id="" placeholder='Min. 6 Characters' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200 mb-5' />
                <span className='body text-[13px] text-[#8a9bb0]'>Confirm Password</span>
                <input type="password" name="" id="" placeholder='Enter Password' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200 mb-7   ' />
                <button type='w-full submit' className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200'>Continue</button>       
            </form>
        </div>
        
        <div className='w-full flex justify-center' >
            <h1 className='body text-[13px] text-[#8a9bb0] mr-1'>Already have an account?</h1>
            <button className='body text-[13px] text-[#38d60c] transition-all duration-200 transition-all duration-200 hover:text-cyan-400'>Sign In</button>
        </div>  
      </div>
    </div>
  )
}

export default SignUp
