// /api/departments 에서 [{code,name}] 받아오기. 실패 시 9개 Fallback.
import { useEffect, useState } from "react";

export default function useDepartments() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/departments", { credentials: "include" });
        if (!ignore && res.ok) {
          const data = await res.json();
          setList(Array.isArray(data) ? data : []);
          return;
        }
        throw new Error();
      } catch {
        setList([
          { code: "ENV_CLEAN",       name: "환경/청소" },
          { code: "CONST_FACILITY",  name: "건설/시설" },
          { code: "TRAFFIC_ROAD",    name: "교통/도로" },
          { code: "SAFETY_DISASTER", name: "안전/재난" },
          { code: "ILLEGAL_ORDER",   name: "불법행위/질서" },
          { code: "ANIMAL_HYGIENE",  name: "동물/위생" },
          { code: "URBAN_ARCH",      name: "도시/건축" },
          { code: "PUBLIC_FAC",      name: "공공시설" },
          { code: "CIVIL_SERVICE",   name: "생활민원" },
        ]);
      }
    })();
    return () => { ignore = true; };
  }, []);
  return list;
}
