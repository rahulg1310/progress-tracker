import React, { useState } from 'react'
import { Gamepad2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useContext } from 'react'
import { UserData } from '../context/UserContext'

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError,setEmailError] = useState('');
  const [passError,setPassError] = useState('');
  const { setUser } = useContext(UserData);
  const validate = () =>{
    setEmailError('');
    setPassError('');
    if(email===''){
        setEmailError('Please enter email');
        return false;
    }
     if(!email.includes('@')){
        setEmailError('Please enter valid email');
        return false;
    }
    if(password===''){
        setPassError('Please enter password');
        return false;
    }
    if(password.length<6){
        setPassError('Please enter atleast 6 characters');
        return false;
    }
    return true;
  }
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
            <form 
            onSubmit={async (e)=>{
                e.preventDefault();
                if(validate()){
                    try{
                        const response = await axios.post('http://localhost:5000/signin',{
                            email : email,
                            password : password
                        });
                        console.log(response.data.userData);
                        setUser(response.data.userData);
                        localStorage.setItem("user",JSON.stringify(response.data.userData));
                        localStorage.setItem("token",JSON.stringify(response.data.token));
                        navigate('/dashboard');
                    }
                    catch(error){
                        console.log(error.response.data);
                        const message = error.response.data.message;
                        setPassError(message);
                    }
                }
            }}
            action="" className='w-full flex flex-col gap-5'>
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Email</span>
                    <input 
                    onChange={(e)=>{
                        setEmail(e.target.value);
                    }}
                    value={email} type="text" name="" id="" placeholder='user@example.com' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200' />
                    <span className='body text-[11px] text-[#ff2929] ml-1'>{emailError}</span>
                </div>
                <div>
                    <span className='body text-[13px] text-[#8a9bb0]'>Password</span>
                    <input 
                    onChange={(e)=>{
                        setPassword(e.target.value);
                    }}
                    value={password} type="password" name="" id="" placeholder='Enter Password' className='body text-[13px] px-2 py-2 rounded-[10px] mt-1 w-full bg-[#080c10] outline-none border border-gray-600/40 focus:border-cyan-400 transition-all duration-200 ' />
                    <span className='body text-[11px] text-[#ff2929] ml-1'>{passError}</span>
                </div>
                <div className='w-full flex justify-end'>
                    <button className='body text-[13px] text-[#38d60c] transition-all duration-200'>Forgot Password?</button>
                </div>
                <button type='submit' className='font-bold tracking-wider text-black w-full bg-linear-to-r from-green-400 to-cyan-400 rounded-[7px] py-1.5 hover:-translate-y-0.5 hover:opacity-80 transition-all duration-200'
                >Sign In</button>
            </form>
        </div>
        <div className='w-full flex justify-center' >
            <h1 className='body text-[13px] text-[#8a9bb0] mr-1'>Don't have an account?</h1>
            <button 
            onClick={()=>{
                navigate("/signup");
            }}
            className='body text-[13px] text-[#38d60c] transition-all duration-200'>Create One</button>
        </div>  
      </div>
    </div>
  )
}

export default SignIn
