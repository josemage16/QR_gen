@echo off
title Sincronizar QR_gen con GitHub
echo ================================================================
echo   Sincronizando rama main con GitHub:
echo   https://github.com/josemage16/QR_gen
echo ================================================================
echo.

set GIT_EXE="C:\Program Files\Microsoft Visual Studio\2022\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe"

%GIT_EXE% status -s
echo.
set /p COMMIT_MSG="Mensaje del commit (Enter para 'Update QR_gen'): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update QR_gen

%GIT_EXE% add -A
%GIT_EXE% commit -m "%COMMIT_MSG%"
%GIT_EXE% push -u origin main

echo.
if %errorlevel% equ 0 (
    echo [EXITO] Cambios sincronizados correctamente en GitHub.
) else (
    echo [AVISO] Verifica tu conexion o inicia sesion con tu cuenta josemage16.
)
echo.
pause
