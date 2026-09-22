import type Database from 'better-sqlite3'
import type { Category, CategoryInput } from '@shared/types'

interface CategoryRow {
  id: number
  name: string
  created_at: string
  updated_at: string
}

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class CategoriesRepo {
  constructor(private db: Database.Database) {}

  list(): Category[] {
    const rows = this.db
      .prepare<[], CategoryRow>('SELECT * FROM categories ORDER BY name ASC')
      .all()
    return rows.map(toCategory)
  }

  get(id: number): Category | undefined {
    const row = this.db
      .prepare<[number], CategoryRow>('SELECT * FROM categories WHERE id = ?')
      .get(id)
    return row ? toCategory(row) : undefined
  }

  create(input: CategoryInput): Category {
    const result = this.db.prepare('INSERT INTO categories (name) VALUES (@name)').run({
      name: input.name
    })
    return this.get(result.lastInsertRowid as number) as Category
  }

  update(id: number, patch: Partial<CategoryInput>): Category {
    const existing = this.get(id)
    if (!existing) {
      throw new Error(`Category ${id} not found`)
    }
    this.db
      .prepare(
        `UPDATE categories
         SET name = @name,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
         WHERE id = @id`
      )
      .run({ id, name: patch.name ?? existing.name })
    return this.get(id) as Category
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  }
}
