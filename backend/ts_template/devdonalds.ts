import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

interface summary {
  name: string;
  cookTime: number;
  ingredients: requiredItem[];
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: cookbookEntry[] = [];

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  return recipeName
          .replace(/[-_]+/g, ' ')
          .replace(/[^A-Za-z ]+/g, '')
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim() || null;
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  const entry = req.body;

  try {
    validateEntry(entry);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  res.json(addEntry(entry));
  return;
});

// Validates a cookbook entry
const validateEntry = (entry: cookbookEntry) => {
  if (cookbook.some((e) => e.name === entry.name)) throw new Error("skill issue");

  if (entry.type === "recipe") {
    const recipe = entry as recipe;
    if (hasDuplicates(recipe.requiredItems)) {
      throw new Error("skill issue");
    }
  } else if (entry.type === "ingredient") {
    const ingredient = entry as ingredient;
    if (ingredient.cookTime < 0) {
      throw new Error("skill issue");
    }
  } else {
    throw new Error("skill issue");
  }
}

// Returns whether or not an array contains duplicate ingredients
const hasDuplicates = (items: requiredItem[]): boolean => {
  const names = new Map();
  for (const i of items) {
    if (names.has(i.name)) {
      return true;
    }
    names.set(i.name, 42);
  }
  return false;
}

// Adds an entry to the cookbook
const addEntry = (entry: cookbookEntry) => {
  cookbook.push(entry);
  return {};
}

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name = req.query.name as string;

  try {
    validateName(name);
  } catch (e) {
    res.status(400).json({ error: e.message });
    return;
  }

  res.json(getSummary(name));
  return;
});

// Validates the name of a recipe
const validateName = (name: string) => {
  const entry = cookbook.find((e) => e.name === name);
  if (!entry || entry.type !== "recipe") throw new Error("skill issue");
  
  const recipe = entry as recipe;
  for (const item of recipe.requiredItems) {
    if (!cookbook.some((e) => e.name === item.name)) {
      throw new Error("skill issue");
    }
  }
}

// Returns the summary of a recipe
const getSummary = (name: string): summary => {
  const recipe = cookbook.find((e) => e.name === name) as recipe;
  const summary = {
    name: name,
    cookTime: 0,
    ingredients: [] as requiredItem[],
  }

  addIngredientsToSummary(recipe, summary);

  return summary;
}

// Adds ingredients of a recipe to a recipe summary
const addIngredientsToSummary = (recipe: recipe, summary: summary) => {
  for (const item of recipe.requiredItems) {
    const entry = cookbook.find((e) => e.name === item.name);
    if (entry.type === "recipe") {
      addIngredientsToSummary(entry as recipe, summary);
    } else {
      const ingredient = summary.ingredients.find((i) => i.name === entry.name);
      if (ingredient) {
        ingredient.quantity += item.quantity;
      } else {
        summary.ingredients.push(item);
      }
      summary.cookTime += (entry as ingredient).cookTime * item.quantity;
    }
  }
}

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
