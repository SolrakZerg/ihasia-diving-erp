# Configuración de Entorno en Casa (Git + pnpm)

Copia y pega el siguiente prompt completo en el chat de tu IA cuando estés en la computadora de tu casa para replicar esta misma configuración segura y optimizada:

```text
Hola. Quiero migrar mi entorno local de desarrollo para el proyecto de "diving-erp" para que use Git y pnpm de forma segura (evitando problemas de vulnerabilidades en npm). Por favor, realiza los siguientes pasos en mi terminal:

1. Comprueba si Git está instalado (si no está directo en el PATH, revisa si existe en su ruta por defecto "C:\Program Files\Git\cmd\git.exe"). Inicializa el repositorio local en el proyecto, vincúlalo a "https://github.com/SolrakZerg/ihasia-diving-erp.git" y sincronízalo con la rama "main" remota para que esté limpio y enlazado.
2. Instala pnpm de forma segura usando el script independiente oficial de PowerShell (evitando npm) con:
   iwr https://get.pnpm.io/install.ps1 -useb | iex
3. Elimina "node_modules" y "package-lock.json" del proyecto.
4. Crea el archivo "pnpm-workspace.yaml" en la raíz del proyecto para permitir el script de construcción de "core-js" añadiendo:
   allowBuilds:
     core-js: true
5. Ejecuta una instalación limpia usando pnpm (a través de la ruta de pnpm.cmd recién instalada si el PATH no se ha refrescado aún) para generar el archivo "pnpm-lock.yaml" y compilar el proyecto.
```
