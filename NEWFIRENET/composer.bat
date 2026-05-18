@echo off
setlocal
set "PHP_EXE=D:\XAMPP\php\php.exe"
set "COMPOSER_PHAR=%~dp0composer.phar"

if not exist "%PHP_EXE%" (
  echo ERROR: PHP executable not found at "%PHP_EXE%".
  exit /b 1
)

if not exist "%COMPOSER_PHAR%" (
  echo ERROR: composer.phar not found at "%COMPOSER_PHAR%".
  exit /b 1
)

"%PHP_EXE%" "%COMPOSER_PHAR%" %*
endlocal
