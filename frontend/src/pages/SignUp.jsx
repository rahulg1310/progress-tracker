import React, { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const SignUp = () => {
  const navigate = useNavigate();  
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpass, setCpass] = useState('');
  const [userError, setUserError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [cpassError, setCpassError] = useState('');

  const validate = () =>{
    setUserError('');
    setEmailError('');
    setPasswordError('');
    setCpassError('');
    if(user===''){
        setUserError('Please enter user');
        return false;
    }
    if(email===''){
        setEmailError('Please enter email');
        return false;
    }
    if(!email.includes('@')){
        setEmailError('Please enter valid email');
        return false;
    }
    if(password===''){
        setPasswordError('Please enter password');
        return false;
    }
    if(password.length<6){
        setPasswordError('Please enter alteast 6 characters');
        return false;
    }
    if(cpass===''){
        setCpassError('Please confirm password');
        return false;
    }
    if(cpass!==password){
        setCpassError('Password not matching');
        return false;
    }
    return true;
  }

  return (
    <div className='min-h-screen w-full bg-[#080c10] flex justify-center items-center px-4'>
      <div className='bg-[#111820] flex flex-col gap-5 py-8 px-8 rounded-2xl border border-white/15 items-center w-full max-w-110'>
        <div className='flex items-center'>
            <h1 className='font-bold bg-linear-to-r from-red-800 to-purple-800 bg-clip-text text-transparent text-3xl tracking-wider'>路 KAIRO</h1>
        </div>
        <div className='flex flex-col justify-center gap-3 items-center'>
            <h1 className='font-bold text-2xl tracking-normal'>Create account</h1>
            <h2 className='body text-xs text-[#8a9bb0]'>Start tracking your gaming journey</h2>
        </div>
        <div className='flex flex-col w-full items-start'>
            <form 
            className='flex flex-col gap-5 w-full'
            onSubmit={async (e)=>{
                e.preventDefault();
                if(validate()){
                    try{
                        const response = await axios.post(`${import.meta.env.VITE_API_URL}/signup`,
                            {
                                username : user,
                                email : email,
                                password : password
                            }
                        );
                        console.log(response.data);
                        navigate('/');
                    }
                    catch(error){
                        console.log(error.response.data);
                        const message = error.response.data.message;
                        if(message.includes('User')){
                            setUserError(message);
                        }
                        else if(message.includes('Email')){
                            setEmailError(message);
                        }
                    }
                }
            }}
            action="">
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Username</span>
                    <input 
                    onChange={(e)=>{
                        setUser(e.target.value);
                    }}
                    value={user} type="text" name="" id="" placeholder='TheRadBrad' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                    <span className='body text-[11px] text-[#ff2929] ml-1'>{userError}</span>
                </div>
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Email</span>
                    <input 
                    onChange={(e)=>{
                        setEmail(e.target.value);
                    }}
                    value={email} type="text" name="" id="" placeholder='user@example.com'
                    autoComplete="email" className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                    <span className='body text-[11px] text-[#ff2929] ml-1'>{emailError}</span>
                </div>
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Password</span>
                    <input 
                    onChange={(e)=>{
                        setPassword(e.target.value);
                    }}
                    value={password} type="password" name="" id="" placeholder='Min. 6 Characters' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                    <span className='body text-[11px] text-[#ff2929] ml-1'>{passwordError}</span>
                </div>
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Confirm Password</span>
                    <input 
                    onChange={(e)=>{
                        setCpass(e.target.value);
                    }}
                    value={cpass} type="password" name="" id="" placeholder='Enter Password' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200 ' />
                    <span className='body text-[11px] text-[#ff2929] ml-1 mb-3'>{cpassError}</span>
                </div>
                <button type='submit' className='font-bold tracking-wider text-black w-full bg-linear-to-r from-purple-400 to-red-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200 mt-3'>Create Account</button>       
            </form>
        </div>
        
        <div className='w-full flex justify-center' >
            <h1 className='body text-[13px] text-[#8a9bb0] mr-1'>Already have an account?</h1>
            <button 
            onClick={()=>{
                navigate("/");
            }}
            className='body text-[13px] text-[#38d60c] transition-all duration-200 transition-all duration-200 hover:text-cyan-400'>Sign In</button>
        </div>  
      </div>
    </div>
  )
}

export default SignUp
