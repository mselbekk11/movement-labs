import Link from 'next/link';
export default function Home() {
  return (
    <div className='h-screen w-screen flex flex-col items-center justify-center'>
      <h1 className='text-4xl font-bold'>Movement Labs</h1>
      <Link href='/register'>
        <button>Register your wallet</button>
      </Link>
    </div>
  );
}
