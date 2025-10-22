-- ========================================
-- SCHEMA DE USUARIOS PARA SUPABASE
-- ========================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id_user BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT CHECK(role IN ('admin', 'manager', 'user')) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Usuario administrador por defecto
-- Password: admin123 (en producción debería estar hasheado con bcrypt)
INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES ('admin', 'admin123', 'Administrador del Sistema', 'admin', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Usuarios de ejemplo (opcional)
INSERT INTO users (username, password_hash, full_name, email, role, is_active)
VALUES
  ('gerente', 'gerente123', 'Gerente Principal', 'gerente@farm.com', 'manager', TRUE),
  ('usuario', 'usuario123', 'Usuario Demo', 'usuario@farm.com', 'user', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Desactivar RLS para demo (EN PRODUCCIÓN: HABILITAR RLS Y CREAR POLÍTICAS)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS (COMENTADAS - PARA PRODUCCIÓN)
-- ========================================

/*
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id_user = auth.uid()) = 'admin'
);

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (id_user = auth.uid());

-- Solo admins pueden crear usuarios
CREATE POLICY "Only admins can create users"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM users WHERE id_user = auth.uid()) = 'admin'
);

-- Solo admins pueden actualizar usuarios
CREATE POLICY "Only admins can update users"
ON users FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM users WHERE id_user = auth.uid()) = 'admin'
);

-- Nadie puede eliminar usuarios (solo desactivar)
CREATE POLICY "No user deletion"
ON users FOR DELETE
TO authenticated
USING (FALSE);
*/

-- ========================================
-- INFORMACIÓN DE ROLES Y PERMISOS
-- ========================================

/*
ROLES:
- admin: Acceso total al sistema
- manager: Gestión completa de animales y registros, lectura de usuarios
- user: Solo lectura de animales y creación de registros básicos

PERMISOS POR ROL:

ADMIN:
  - animals: create, read, update, delete
  - records: create, read, update, delete
  - users: create, read, update, delete
  - reports: view, export

MANAGER:
  - animals: create, read, update
  - records: create, read, update, delete
  - users: read
  - reports: view, export

USER:
  - animals: read
  - records: create, read
  - reports: view
*/
