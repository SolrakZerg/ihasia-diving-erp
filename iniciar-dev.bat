@echo off
title Diving ERP - Dev Server
cd /d D:\Projects\diving-erp

:: Abrir el navegador en localhost:5173
start http://localhost:5173/

:: Arrancar el servidor de desarrollo
pnpm run dev
pause
