# Autogest

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.7.

# 🚀 AutogestsWeb

**AutogestsWeb** es una plataforma web empresarial desarrollada en Angular, diseñada para la gestión integral de productos, marcas, categorías, empleados y empresas. Utiliza Supabase como backend para autenticación y almacenamiento de datos, ofreciendo una experiencia moderna, segura y escalable.

---

## 🗂️ Estructura del Proyecto

```
src/
│
├── app/
│   ├── auth/         # Lógica de autenticación y registro de usuarios
│   ├── manage/       # Servicios y lógica de negocio para entidades principales
│   ├── models/       # Modelos TypeScript del dominio
│   └── store/        # Páginas principales y layouts de la aplicación
│
├── environments/     # Configuración de entornos
├── index.html        # Entrada principal de la app
└── main.ts           # Bootstrap de Angular
```

---

## ✨ Características Principales

- **Autenticación segura** con Supabase (login, registro, guardias de ruta)
- **Gestión de empresas** y usuarios asociados
- **CRUD de productos, marcas y categorías**
- **Gestión de empleados y módulos de permisos**
- **Dashboard y navegación moderna**
- **Arquitectura modular y escalable**
- **Tipado fuerte con TypeScript**
- **UI reactiva y responsiva**

---

## 🛠️ Tecnologías Utilizadas

- [Angular](https://angular.io/) 17+
- [Supabase](https://supabase.com/) (Auth & Database)
- [RxJS](https://rxjs.dev/) para programación reactiva
- [TypeScript](https://www.typescriptlang.org/)
- [Bootstrap](https://getbootstrap.com/) (opcional, según estilos)
- [Angular Signals](https://angular.dev/reference/signals) para estado reactivo

---

## 🚦 Estructura de Carpetas Destacada

- **`auth/`**: Formularios de login/registro, guardias y servicios de autenticación.
- **`manage/`**: Servicios para productos, marcas, categorías, empresas, módulos y usuarios.
- **`models/`**: Interfaces y modelos de datos.
- **`store/`**: Páginas principales (productos, marcas, categorías, empleados, empresa, kardex, etc.) y layouts.

---

## ⚡ Instalación y Ejecución

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/autogestsweb.git
   cd autogestsweb
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configura el entorno:**
   - Edita `src/environments/environment.ts` con tus claves de Supabase.

4. **Ejecuta la aplicación:**
   ```bash
   ng serve
   ```
   Accede a [http://localhost:4200](http://localhost:4200) en tu navegador.

---

## 🔒 Seguridad

- Todas las rutas principales están protegidas por guardias de autenticación.
- Los datos sensibles se gestionan mediante Supabase y nunca se exponen en el frontend.

---

## 📦 Scripts Útiles

- `ng serve` — Inicia la app en modo desarrollo.
- `ng build` — Compila la app para producción.
- `ng test` — Ejecuta los tests unitarios.

---

## 👨‍💻 Contribución

¿Quieres mejorar AutogestsWeb?  
¡Las contribuciones son bienvenidas! Por favor, abre un issue o un pull request.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT.  
Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

## 📬 Contacto

¿Dudas o sugerencias?  
Escríbeme a [tu-email@dominio.com](mailto:tu-email@dominio.com)

---

<div align="center">
  <b>¡Gracias por usar AutogestsWeb!</b> 🚀
</div>
