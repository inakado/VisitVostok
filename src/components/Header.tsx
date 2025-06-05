"use client";

import Link from "next/link";
import { SparklesIcon, Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { Menu, Transition } from "@headlessui/react";
import Image from "next/image";
import { useUser } from "@/lib/hooks";
import { Fragment } from 'react';

export default function Header() {
  const { user } = useUser();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Основной контейнер шапки */}
      {/* Бургер-меню (слева) - весь header теперь внутри Menu, чтобы использовать open state */}
      <Menu as="div" className="w-full h-full relative z-50">
        {({ open }) => (
          <>
            {/* Затемнение всего экрана с радиальным градиентом из левого верхнего угла */}
            <Transition
              show={open}
              as={Fragment}
              enter="transition-opacity ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div
                className="fixed inset-0 z-40"
                style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(0,0,0,0.3) 0%, transparent 50%)' }}
                aria-hidden="true"
              />
            </Transition>

            <div className="mx-auto px-2 py-3 flex items-center justify-between relative z-50">
              {/* Бургер-меню (слева) */}
              <div className="flex items-center">
                <Menu.Button className="h-[44px] w-[44px] p-2 rounded-full bg-white hover:bg-gray-700 transition shadow-lg relative z-50">
                  {open ? (
                    <XMarkIcon className="h-7 w-7 text-[#2C3347] hover:text-white" />
                  ) : (
                    <Bars3Icon className="h-7 w-7 text-[#2C3347] hover:text-white" />
                  )}
                </Menu.Button>

                {/* Логотип (привязан к левой стороне, после меню) */}
                <Link href="/" className="block ml-2">
                  <h1 className="text-xl font-bold rounded-full text-[#2C3347] pl-2 pr-2 sm:pr-4 py-2 tracking-tight flex items-center bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <Image src="/vv-logo.svg" alt="Логотип" width={28} height={28} className="h-7 mr-0 sm:mr-2" />
                    <span className="hidden sm:inline">ВИЗИТВОСТОК</span>
                  </h1>
                </Link>
              </div>

              {/* Правая группа: поиск и профиль/вход */}
              <div className="flex items-center gap-2">
                {/* Кнопка профиля / входа */}
                {/*
                {user ? (
                  <Link
                    href="/profile"
                    className="h-[44px] text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-full px-4 py-2 transition duration-200 font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Image
                      src={user.avatarUrl || '/default-avatar.png'}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    ПРОФИЛЬ
                  </Link>
                ) : (
                */}
                {!user && (
                  <Link
                    href="/auth"
                    className="h-[44px] text-m text-[#2C3347] bg-white hover:text-white hover:bg-[#2C3347] rounded-full px-4 py-2 transition duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <SparklesIcon className="h-5 w-5" />
                    <span className="hidden sm:inline">НА БОРТ</span>
                  </Link>
                )}

                {/* Кнопка поиска */}
                <button
                   aria-label="Поиск"
                   className="h-[44px] w-[44px] p-2 rounded-full bg-white hover:bg-gray-700 transition shadow-lg hover:shadow-xl"
                   // Здесь можно добавить onClick для открытия поиска
                 >
                   <MagnifyingGlassIcon className="h-7 w-7 text-[#2C3347] hover:text-white" />
                 </button>
              </div>
            </div>

            {/* Выпадающее меню: origin-top-left для открытия влево */}
            {/* Это меню должно быть вне основного flex контейнера хедера, чтобы не влиять на его раскладку */}
            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items static className="absolute left-0 mt-0 origin-top-left w-fit z-50">
                {/* mt-0 to position directly below header, adjust as needed */} 
                <div className="py-1 ml-2">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/"
                        className={`block max-w-fit px-4 py-2 mb-4 text-m text-left bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${ active ? "bg-white text-[#5783FF]" : "text-[#2C3347]" }`}
                      >
                        ГЛАВНАЯ
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/transport"
                        className={`block max-w-fit px-4 py-2 mb-4 text-m text-left bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${ active ? "bg-gray-700 text-[#5783FF]" : "text-[#2C3347]" }`}
                      >
                        ТРАНСПОРТ
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/activities"
                        className={`block max-w-fit px-4 py-2 mb-4 text-m text-left bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${ active ? "bg-gray-700 text-[#5783FF]" : "text-[#2C3347]" }`}
                      >
                        АКТИВНОСТИ
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/accommodation"
                        className={`block max-w-fit px-4 py-2 mb-4 text-m text-left bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${ active ? "bg-gray-700 text-[#5783FF]" : "text-[#2C3347]" }`}
                      >
                        ЖИЛЬЕ
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/about"
                        className={`block max-w-fit px-4 py-2 text-m text-left bg-white rounded-full shadow-md hover:shadow-lg transition-shadow ${ active ? "bg-gray-700 text-[#5783FF]" : "text-[#2C3347]" }`}
                      >
                        О НАС
                      </Link>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </header>
  );
}