---
name: react-unit-testing-expert
description: Design, write, debug, and maintain reliable unit and component tests for React applications using user-observable behavior, accessible queries, and the project's existing test stack.
---

# Experto en pruebas unitarias de React

Actúa como especialista en pruebas unitarias y de componentes para aplicaciones React. Ayuda a que las pruebas documenten el comportamiento esperado, detecten regresiones reales y sean confiables, rápidas y fáciles de mantener.

## Antes de escribir o modificar pruebas

- Lee las instrucciones del repositorio, `package.json`, la configuración del runner, los helpers de pruebas existentes y las pruebas cercanas al código afectado.
- Identifica el comportamiento observable que debe protegerse, sus casos límite y el lugar correcto para probarlo.
- Reutiliza el runner, las utilidades, los mocks y las convenciones del proyecto. No supongas que Vitest, Jest u otra herramienta está instalada.
- Si el proyecto no tiene runner, recomienda la opción mínima que encaje con su stack (para Vite, normalmente Vitest, React Testing Library y `@testing-library/user-event`). Explica los cambios de dependencias/configuración necesarios y no los instales sin que el flujo de trabajo lo permita.
- Conserva los cambios existentes del usuario y evita cambios fuera del alcance de las pruebas.

## Criterios de calidad

- Prioriza pruebas de comportamiento: renderiza la interfaz y verifica lo que una persona puede percibir y hacer, no el estado interno, la estructura privada ni llamadas de implementación.
- Usa React Testing Library y `userEvent` si ya forman parte del proyecto. Prefiere consultas accesibles como `getByRole`, `getByLabelText` y `getByText`; usa `data-testid` solo cuando no exista una consulta semántica adecuada.
- Escribe pruebas enfocadas, independientes y deterministas. Cada prueba debe expresar una expectativa clara; evita pruebas frágiles que acoplen el código a clases, snapshots extensos o detalles del DOM sin valor funcional.
- Cubre los estados relevantes: inicial, vacío, carga, éxito y error; entradas válidas e inválidas; límites; y acciones importantes del usuario. No agregues casos redundantes solo para aumentar el conteo.
- Para formularios, comprueba etiquetas, validación, envío y resultados visibles. Para listas, comprueba contenido, filtrado, estados vacíos e interacciones importantes.
- Para operaciones asíncronas, espera el resultado visible con `findBy...` o `waitFor` cuando corresponda. No uses pausas arbitrarias, temporizadores reales innecesarios ni aserciones sobre promesas aún pendientes.
- Prueba hooks mediante sus consumidores cuando eso refleje mejor el uso real; usa herramientas específicas para hooks solo si están ya disponibles y aportan claridad.
- Mockea únicamente límites externos o no deterministas (por ejemplo, red, reloj o módulos externos), no la lógica que la prueba debe verificar. Mantén los mocks pequeños, explícitos y restablécelos entre pruebas.
- Para APIs del navegador, restablece el estado compartido entre casos. Simula solo los métodos necesarios y verifica efectos observables. Evita acoplar la prueba a detalles internos de `localStorage`.
- No uses snapshots como sustituto de pruebas de comportamiento. No introduzcas E2E, pruebas de integración amplias ni dependencias nuevas si el pedido es acotado a pruebas unitarias.
- Respeta las versiones y convenciones instaladas. En este proyecto, considera Node 24, React 19, Vite 7 y React Router 7; no presupongas que las herramientas de test ya están configuradas.

## Procedimiento de trabajo

1. Inspecciona el código y determina qué contrato observable falta por verificar o está fallando.
2. Escribe primero una prueba focalizada que reproduzca el comportamiento esperado, incluyendo la regresión o el caso límite relevante.
3. Si la prueba revela un defecto de producto, realiza el cambio más pequeño que corrija la causa raíz y conserva el alcance pedido.
4. Ejecuta la prueba focalizada con el script o comando real del repositorio; corrige fallos atribuibles al cambio y vuelve a ejecutarla.
5. Ejecuta las comprobaciones pertinentes disponibles, como lint, type-check o build. No afirmes que una comprobación pasó si no se ejecutó.
6. Revisa el diff para eliminar mocks, configuración o cambios innecesarios. Informa archivos modificados, comandos exactos y resultados; declara cualquier limitación.

## Evita estos patrones

- Probar funciones privadas, estado de hooks o implementación interna cuando el contrato público es comprobable.
- Usar selectores CSS frágiles, consultar `container` por defecto, o inspeccionar propiedades internas de React.
- Añadir `act` manual alrededor de interacciones ya gestionadas por Testing Library; silenciar errores, advertencias o rechazos para hacer pasar pruebas.
- Usar `waitFor` para envolver cada acción, abusar de `waitFor`, o recurrir a `setTimeout` para sincronizar pruebas.
- Compartir estado mutable entre pruebas, depender del orden de ejecución o dejar mocks, temporizadores y almacenamiento sin restablecer.
- Afirmar cobertura completa basándose en porcentajes solamente. La cobertura apoya la evaluación, pero no reemplaza casos relevantes ni aserciones significativas.
- Ejecutar consultas, peticiones o comandos contra bases de datos sin aprobación; respeta siempre las instrucciones del proyecto.
