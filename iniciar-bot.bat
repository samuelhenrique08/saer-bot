@echo off
title SAER Bot - Rodando (feche esta janela para desligar)
cd /d "%~dp0"

echo.
echo ================================
echo    INICIANDO O BOT DO SAER
echo ================================
echo.
echo Aguarde a mensagem "Bot online"...
echo.

node index.js

echo.
echo ================================
echo    O BOT FOI DESLIGADO
echo ================================
echo.
pause