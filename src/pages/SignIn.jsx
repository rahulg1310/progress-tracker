import React from 'react'
import { Gamepad2 } from 'lucide-react'

const SignIn = () => {
  return (
    <div className='min-h-screen w-full bg-[#080c10] flex justify-center items-center px-4'>
      <div className='bg-[#111820] flex flex-col gap-5 py-8 px-8     rounded-2xl border border-white/15 items-center w-full max-w-110'>
        <div className='flex items-center'>
            <Gamepad2 size={38} className='mr-3'/>
            <h1 className='font-bold bg-linear-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent text-3xl tracking-wider'>QUESTLOG</h1>
        </div>
        <div className='flex flex-col justify-center gap-3 items-center'>
            <h1 className='font-bold text-2xl tracking-normal'>Welcome Back</h1>
            <h2 className='body text-xs text-[#8a9bb0]'>Sign in to your account to continue</h2>
        </div>
        <div className='flex flex-col w-full items-start'>
            <form action="" className='w-full'>
                <span className='body text-[13px] text-[#8a9bb0]'>Email</span>
                <input type="text" name="" id="" placeholder='user@example.com' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 mb-5 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                <span className='body text-[13px] text-[#8a9bb0]'>Password</span>
                <input type="password" name="" id="" placeholder='Enter Password' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
            </form>
        </div>
        <div className='w-full flex justify-end'>
            <button className='body text-[13px] text-[#38d60c] transition-all duration-200'>Forgot Password?</button>
        </div>
        <div className='w-full'>
            <button type='submit' className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200'>Sign In</button>
        </div>
        <div className='w-full flex justify-center'>
            <span className='body text-xs text-[#4a5568]'>or continue with</span>
        </div>
        <div className='w-full flex justify-between gap-2'>
            <button className='min-w-0 body flex-1 py-2 bg-[#212833] rounded-[7px] text-[#8a9bb0] text-[14px] hover:bg-gray-500/30 transition-all duration-200'>Steam</button>
            <button className='min-w-0 body flex-1 py-2 bg-[#212833] rounded-[7px] text-[#8a9bb0] text-[14px] hover:bg-gray-500/30 transition-all duration-200'>Google</button>
            <button className='min-w-0 body flex-1 py-2 bg-[#212833] rounded-[7px] text-[#8a9bb0] text-[14px] hover:bg-gray-500/30 transition-all duration-200'>Discord</button>
        </div>
        <div className='w-full flex justify-center' >
            <h1 className='body text-[13px] text-[#8a9bb0] mr-1'>Don't have an account?</h1>
            <button className='body text-[13px] text-[#38d60c] transition-all duration-200'>Create One</button>
        </div>  
      </div>
    </div>
  )
}

export default SignIn
