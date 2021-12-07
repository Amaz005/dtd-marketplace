import Link from 'next/link'
import logo from '../public/duck-logo.svg'
import Image from 'next/image'
const Navbar = () => {
    return (
        <nav className="flex items-center justify-between flex-wrap bg-gray-900 p-4">
            <div className="flex items-center flex-shrink-0 text-white mr-6">
                <Image alt="" src={logo.src} height={25} width={25}/>
                <span className="ml-3"/>
                <span className="font-semibold text-xl font-bold tracking-tight">DTD marketplace</span>
            </div>
            <div className="block lg:hidden">
                <button className="flex items-center px-3 py-2 border rounded text-teal-200 border-teal-400 hover:text-white hover:border-white">
                <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
                </button>
            </div>
            <div className="w-full block flex-grow lg:flex lg:items-center text-white lg:w-auto">
                <div className="text-sm lg:flex-grow">
                <Link href="/">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                        Home
                    </a>
                </Link>
                <Link href="/sell-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                        Sell Asset
                    </a>
                </Link>
                <Link href="/my-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                    Asset you have bought
                    </a>
                </Link>
                <Link href="/create-asset">
                    <a className="block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white">
                        Create asset
                    </a>
                </Link>
                </div>
            </div>
        </nav>
    )
}
export default Navbar;