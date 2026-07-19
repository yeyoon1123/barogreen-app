import React from "react";
import useDepartments from "../features/users/reports/useDepartments";

export default function DepartmentSelect({ value, onChange, style }) {
  const departments = useDepartments();
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={style}>
      <option value="">접수완료</option>
      {departments.map((d) => (
        <option key={d.code} value={d.code}>{d.name}</option>
      ))}
    </select>
  );
}
