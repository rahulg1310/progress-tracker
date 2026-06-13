import React, { useContext, useState } from 'react'
import { UserData } from '../context/UserContext';
import axios from 'axios';

const ProfileModal = (props) => {
  const [userError, setUserError] = useState("");
  const [bioError, setBioError] = useState("");
  const [pfpError, setPfpError] = useState("");
  const {user,setUser} = useContext(UserData);
  const updateProfile = async ()=>{
    if(!isValid()) return;
    try{
        const res = await axios.put(`http://localhost:5000/profile/${user._id}`,
        {
        username : props.editUser,
        bio : props.editBio,
        profilePicture: props.editPfp
        
    });
    console.log(res.data.user);
    setUser(res.data.user);
    localStorage.setItem("user",JSON.stringify(res.data.user));
    props.setModal(false);
    }
    catch(error){
        console.log(error);
        setUserError(error.response?.data?.message);
    }
  }
  const isValid = () =>{
    if(props.editUser.trim() === ""){
        setUserError("Please Enter a Valid Username");
        return false;
    }
    if(props.editBio.trim() === ""){
        setBioError("Please Enter a Valid About Me")
        return false;
    }
    return true;
  }
  return (
    <div className='fixed inset-0 bg-black/70 flex justify-center items-center p-4 z-50'>
        <div className='bg-[#111820] max-w-3xl w-full rounded-2xl border border-gray-400/20 flex flex-col gap-5 p-6'>
            <div className='flex justify-between items-center'>
                <h1 className='font-bold text-xl tracking-wider'>Edit Profile</h1>
                <button 
                onClick={()=>{
                    props.setModal(false);
                }}
                className='body hover:bg-gray-700 transition-all duration-200 py-1 px-2 rounded'>X</button>
            </div>
            <div className='h-20 w-20 rounded-full bg-gray-700 flex justify-center items-center'>
                <div className='h-19 w-19 rounded-full bg-[#1a2332] overflow-hidden'>
                    <img src="https://pbs.twimg.com/media/G1c19UTWoAAYFAs.jpg" alt="pfp" />
                </div>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Profile Picture</span>
                <input 
                onChange={(e)=>{
                    props.setEditPfp(e.target.value);
                }}
                type="text" value={props.editPfp} placeholder='Set Profile Pic...' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
                <span className='body text-[11px] text-[#ff2929]'></span>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>Username</span>
                <input 
                onChange={(e)=>{
                    props.setEditUser(e.target.value);
                    setUserError("");
                }}
                type="text" value={props.editUser} placeholder='Edit User...' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
                <span className='body text-[11px] text-[#ff2929]'>{userError}</span>
            </div>
            <div className='w-full flex flex-col gap-1'>
                <span className='body text-[#8a9bb0] text-[12px] font-semibold'>About Me</span>
                <textarea 
                onChange={(e)=>{
                    props.setEditBio(e.target.value);
                    setBioError("");
                }}
                rows={4} value={props.editBio} placeholder='Edit About Me...' className='bg-[#080c10] py-1 px-2 rounded-[6px] text-[15px] body border outline-none border-white/15 focus:border-green-400 transition-all duration-200 placeholder:text-[#4a5568]'/>
                <span className='body text-[11px] text-[#ff2929]'>{bioError}</span>
            </div>
            <div className='flex justify-end gap-8 border-t border-t-gray-600/70 pt-5'>
                <button 
                onClick={()=>{
                  props.setModal(false);
                }}
                className='font-bold tracking-wider text-white bg-linear-to-r bg-[#080c10] rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Cancel</button>
                <button 
                onClick={()=>{
                    updateProfile();
                }}
                className='font-bold tracking-wider text-black bg-linear-to-r from-red-400 to-purple-400 rounded-[7px] py-1.5 hover:opacity-60 transition-all duration-200 px-3'>Save Changes</button>
            </div>
        </div>
    </div>
  )
}

export default ProfileModal
