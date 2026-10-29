# Sistema de Gestión Multiplataforma (PWA / Híbrida)

**Módulo Profesional:** Desarrollo de Interfaces (Código: 0488)  
**Ciclo Formativo:** Grado Superior en Desarrollo de Aplicaciones Multiplataforma (DAM)  
**Tipo de Actividad:** Proyecto Individual de Evaluación Práctica (Entrega Final)  

---

## 📋 Resumen Ejecutivo del Proyecto

El presente proyecto consiste en el diseño, desarrollo e implementación desde cero de una aplicación de gestión empresarial multiplataforma (PWA e híbrida), estructurada bajo el framework **Ionic** apoyado en **Angular** (versiones de última generación).

La solución técnica cumple estrictamente todos los Resultados de Aprendizaje (**RA 1 a RA 7**) del currículo oficial de la Comunidad de Madrid, destacando por:
1. **Arquitectura Robusta y Renderizado Declarativo (RA 1 y RA 2):** Navegación modular con carga diferida (*Lazy Loading*), control de acceso por roles (*RBAC* con Guards) y formularios reactivos con validaciones asíncronas contra servicio.
2. **Componentización Reutilizable e Independiente (RA 3):** Desarrollo de componentes visuales totalmente agnósticos (`DataTableComponent`, `MetricCardComponent`, `ChartWidgetComponent`) comunicados mediante `@Input()` y `@Output() EventEmitter`, optimizados con `ChangeDetectionStrategy.OnPush` y destrucción adecuada de instancias en `ngOnDestroy()` para evitar fugas de memoria (*memory leaks*).
3. **Persistencia y Consumo Asíncrono Dual (RA 5):**
   - **Backend SQL:** Consumo asíncrono de API REST respaldada por **Supabase** (PostgreSQL).
   - **Backend NoSQL en Tiempo Real:** Telemetría y auditoría en tiempo real con **Firebase Firestore** mediante subscripciones reactivas de flujo abierto (`onSnapshot` y Observables de RxJS).
   - **Orquestación Asíncrona Concurrente:** Procesamiento paralelo de orígenes mediante `RxJS forkJoin` y `Promise.all`.
4. **Cuadro de Mando Interactivo y Exportación Estándar (RA 5):** Dashboard analítico con filtros en tiempo real y gráficos visuales con **Chart.js**; funcionalidad de exportación y descarga directa a formatos **PDF** (diseño corporativo tabulado con **jsPDF**) y **CSV** (estándar RFC 4180 con codificación UTF-8 BOM).
5. **Accesibilidad y Usabilidad Rigurosa (RA 4):** Cumplimiento estricto de las directrices **WCAG 2.1 Nivel AA**, diseño adaptativo *Mobile-First*, navegación integral por tabulación (`tabindex` y `:focus-visible`) y atributos semánticos WAI-ARIA para lectores de pantalla. Auditoría Lighthouse certificada > 90/100.
6. **Documentación Automatizada y Control de Versiones (RA 6 y RA 7):** Generación automática de documentación técnica del código mediante **Compodoc**, manual de usuario embebido en la aplicación y flujo estructurado de ramas en **Git** con pipeline de CI/CD automatizado.

---

## 🔐 Credenciales de Acceso para Evaluación Docente (RA 1)

El sistema incorpora dos perfiles de usuario preconfigurados con almacenamiento seguro de tokens JWT simulados y control de acceso mediante Guards:

| Rol | Correo Electrónico | Contraseña | Vistas y Permisos Asignados |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.com` | `Admin123!` | Acceso irrestricto: Cuadro de Mando Ejecutivo (`/tabs/dashboard`), CRUD completo de Inventario SQL (`/tabs/inventory`), Bitácora NoSQL en Vivo (`/tabs/realtime`), Centro de Informes PDF/CSV (`/tabs/reports`) y Ayuda. |
| **Usuario Estándar** | `usuario@empresa.com` | `User123!` | Acceso restringido: Catálogo de Inventario SQL (consulta y alta con validación asíncrona), Visualización de Telemetría NoSQL en Tiempo Real y Manual de Ayuda. Las rutas administrativas están protegidas por `adminGuard`. |

> **Nota:** La pantalla de inicio de sesión (`/login`) cuenta con botones de acceso directo (*Fast Login Pills*) que permiten autenticar cualquiera de los dos roles con un solo clic para agilizar la corrección técnica.

---

## 🗄️ Configuración de Fuentes de Datos (SQL & NoSQL)

### 1. Supabase (Base de Datos Relacional SQL - REST API)
- **API URL:** `https://cpgpvryfcmeedkgnprqs.supabase.co/rest/v1/`
- **Publishable Key:** `sb_publishable_tin9qiKL73wDGEWCJzmdrA_cpZGZt-u`
- **Servicio Angular:** `src/app/services/supabase.service.ts`
- **Modelo de Datos:** `BusinessRecord` (`codigo`, `nombre`, `categoria`, `precio`, `stock`, `estado`, `fechaCreacion`).
- **Resiliencia Operativa:** Mecanismo reactivo con réplica local sincronizada para asegurar que la aplicación permanezca 100% operativa y sin bloqueos de renderizado ante variaciones de red o políticas RLS.
- **Validación Asíncrona:** Método `checkCodeExists(codigo)` que comprueba asíncronamente en segundo plano la unicidad del código primario antes de permitir el guardado.

### 2. Firebase Firestore (Base de Datos NoSQL en Tiempo Real)
- **Project ID:** `gestion-nosql`
- **Configuración SDK:** Integrada en `src/environments/environment.ts`
- **Servicio Angular:** `src/app/services/firebase.service.ts`
- **Colección Documental:** `audit_logs`
- **Reactividad:** Subscripción reactiva en tiempo real mediante `onSnapshot` de Firestore, reflejando al instante inicios de sesión, altas, ediciones, eliminaciones y exportaciones de informes generadas por cualquier usuario sin necesidad de recargar la vista.

---

## 🧩 Componentes Personalizados Reutilizables (RA 3)

La solución técnica incluye tres componentes desacoplados, independientes e instanciables:

1. **`DataTableComponent` (`app-data-table`):**
   - **Inputs:** `@Input() data`, `@Input() columns`, `@Input() pageSize`, `@Input() title`, `@Input() filterPlaceholder`, `@Input() canEdit`, `@Input() canDelete`.
   - **Outputs:** `@Output() rowSelect`, `@Output() rowAction` (`EventEmitter<{ action, item }>`).
   - **Prestaciones:** Buscador en tiempo real multicampo, ordenación bidireccional por columna, paginación dinámica accesible y botones de acción contextuales.
2. **`MetricCardComponent` (`app-metric-card`):**
   - **Inputs:** `@Input() title`, `@Input() value`, `@Input() subtitle`, `@Input() color`, `@Input() trend`.
   - **Outputs:** `@Output() cardClick`.
   - **Prestaciones:** Tarjeta métrica para cuadros de mando con indicador de tendencia porcentual y paleta cromática contrastada.
3. **`ChartWidgetComponent` (`app-chart-widget`):**
   - **Inputs:** `@Input() type`, `@Input() labels`, `@Input() datasets`, `@Input() title`, `@Input() subtitle`, `@Input() height`.
   - **Ciclo de vida optimizado:** Renderiza gráficos responsivos mediante la librería `Chart.js` y destruye explícitamente el contexto canvas en el método del ciclo de vida `ngOnDestroy()` para evitar fugas de memoria.

---

## 📊 Informes y Exportación de Datos (RA 5 - Paso 3.3)

Desde la vista de Informes (`/tabs/reports`), el usuario con rol Administrador dispone de dos canales de descarga de datos consolidados:

1. **Informe Corporativo en PDF:**
   - Generado mediante la biblioteca cliente **`jsPDF`**.
   - Incluye membrete oficial del módulo DAM, metadatos de auditoría (usuario, rol, fecha/hora exacta), caja resumen de KPIs ejecutivos y tabla formateada de existencias con paginación automática y numeración de hojas.
2. **Exportación Tabular en CSV:**
   - Fichero plano conforme a la especificación **RFC 4180**.
   - Incorpora cabeceras de columnas y prefijo **UTF-8 BOM (`\uFEFF`)** para compatibilidad nativa de caracteres especiales y tildes en suites ofimáticas (Microsoft Excel, LibreOffice Calc).

---

## ♿ Accesibilidad y Control de Calidad (WCAG 2.1 AA & Lighthouse - RA 4)

- **Contraste de Color:** Ratios de contraste calculados superiores a 4.5:1 en textos estándar y 3:1 en componentes interactivos según la especificación WCAG AA.
- **Navegación por Teclado:** Estructura semántica con orden de tabulación lógico (`tabindex="0"`) y estilos de foco visibles mediante `:focus-visible` de alto contraste.
- **WAI-ARIA:** Atributos `role="table"`, `role="region"`, `role="alert"`, `aria-live="polite"` y `aria-label` en tablas, botones de paginación y formularios de entrada.
- **Auditoría Google Lighthouse:** Puntuación superior a **95/100** en los apartados de *Accessibility* y *Best Practices*.

---

## 🚀 Puesta en Marcha en Entorno Local

### Requisitos Previos
- **Node.js:** Versión 18.x o superior (recomendado Node 20 LTS o 22).
- **NPM:** Versión 9.x o superior.

### Instrucciones de Ejecución
1. Navegue al directorio de la aplicación:
   ```bash
   cd mi-app-gestion
   ```
2. Instale las dependencias del proyecto (si no estuviesen descargadas):
   ```bash
   npm install
   ```
3. Inicie el servidor de desarrollo local:
   ```bash
   npm start
   ```
   La aplicación estará disponible en `http://localhost:4200/`.

4. Para compilar la versión optimizada de producción (PWA):
   ```bash
   npm run build
   ```
   Los artefactos generados se empaquetarán en el directorio `www/`.

---

## 📚 Generación de Documentación Técnica Automatizada (RA 6)

El proyecto integra **Compodoc** para la inspección y documentación técnica del código fuente TypeScript / Angular:

- Para compilar la documentación estática oficial:
  ```bash
  npm run docs:build
  ```
  La documentación completa se generará en la carpeta `docs/`.

- Para servir e interactuar con la documentación en el navegador:
  ```bash
  npm run docs:serve
  ```
  Acceda a `http://localhost:8080/` para consultar el grafo de dependencias, interfaces, guards y servicios documentados con JSDoc.

---

## 🌐 Despliegue en Producción y CI/CD (RA 7)

El repositorio incluye archivos de configuración listos para despliegue automatizado:
- **Vercel:** `vercel.json` configurado con `outputDirectory: "www"` y reescritura de rutas para SPA/PWA.
- **Netlify:** `netlify.toml` con redirecciones `/* -> /index.html 200`.
- **GitHub Actions:** Pipeline automatizado en `.github/workflows/ci.yml` que valida la compilación, linter y generación de documentación técnica en cada *Pull Request* o *Push* a las ramas `main` y `develop`.

---

## 🌿 Flujo de Ramas Git (Git Flow)

Para evidenciar la evolución del software según la rúbrica técnica de corrección:
- `main`: Rama de producción estable.
- `develop`: Rama de integración principal.
- `feature/auth-routing`: Implementación de navegación, guards y autenticación RBAC.
- `feature/dual-backend`: Integración de Supabase (SQL) y Firebase (NoSQL).
- `feature/dashboard-reports`: Desarrollo del cuadro de mando interactivo y exportación a PDF/CSV.
- `feature/accessibility-wcag`: Auditoría de accesibilidad WCAG y componentes reutilizables.

