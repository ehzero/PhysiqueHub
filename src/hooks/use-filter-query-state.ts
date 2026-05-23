"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Filters } from "@/lib/data";
import {
  buildHomeFilterPath,
  buildListFilterPath,
  parseHomeFilterQuery,
  parseListFilterQuery,
  type HomeFilterQueryState,
  type ListFilterQueryState,
} from "@/lib/filter-query";

export function useListFilterQueryState(
  initialState: ListFilterQueryState,
  basePath = "/competitions",
) {
  const [state, setState] = useState<ListFilterQueryState>(initialState);
  const stateRef = useRef(state);
  const lastPathRef = useRef(buildListFilterPath(basePath, state));

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    function syncCurrentLocation() {
      if (window.location.pathname !== basePath) {
        return;
      }

      const next = parseListFilterQuery(
        new URLSearchParams(window.location.search),
      );
      const nextPath = buildListFilterPath(basePath, next);

      if (nextPath !== lastPathRef.current) {
        lastPathRef.current = nextPath;
        stateRef.current = next;
        setState(next);
      }
    }

    syncCurrentLocation();
    window.addEventListener("popstate", syncCurrentLocation);
    return () => window.removeEventListener("popstate", syncCurrentLocation);
  }, [basePath]);

  const updateState = useCallback(
    (next: ListFilterQueryState) => {
      const nextPath = buildListFilterPath(basePath, next);

      stateRef.current = next;
      lastPathRef.current = nextPath;
      setState(next);
      window.history.replaceState(null, "", nextPath);
    },
    [basePath],
  );

  const setFilters = useCallback(
    (fn: (filters: Filters) => Filters) => {
      const next = {
        ...stateRef.current,
        filters: cleanFilters(fn(stateRef.current.filters)),
      };
      updateState(next);
    },
    [updateState],
  );

  const setSearch = useCallback(
    (search: string) => {
      updateState({
        ...stateRef.current,
        search,
      });
    },
    [updateState],
  );

  return {
    filters: state.filters,
    search: state.search,
    setFilters,
    setSearch,
    currentPath: buildListFilterPath(basePath, state),
  };
}

export function useHomeFilterQueryState(
  initialState: HomeFilterQueryState,
  basePath = "/",
) {
  const [state, setState] = useState<HomeFilterQueryState>(initialState);
  const stateRef = useRef(state);
  const lastPathRef = useRef(buildHomeFilterPath(basePath, state));

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    function syncCurrentLocation() {
      if (window.location.pathname !== basePath) {
        return;
      }

      const next = parseHomeFilterQuery(
        new URLSearchParams(window.location.search),
      );
      const nextPath = buildHomeFilterPath(basePath, next);

      if (nextPath !== lastPathRef.current) {
        lastPathRef.current = nextPath;
        stateRef.current = next;
        setState(next);
      }
    }

    syncCurrentLocation();
    window.addEventListener("popstate", syncCurrentLocation);
    return () => window.removeEventListener("popstate", syncCurrentLocation);
  }, [basePath]);

  const updateState = useCallback(
    (next: HomeFilterQueryState) => {
      const nextPath = buildHomeFilterPath(basePath, next);

      stateRef.current = next;
      lastPathRef.current = nextPath;
      setState(next);
      window.history.replaceState(null, "", nextPath);
    },
    [basePath],
  );

  return {
    state,
    setHomeFilterState: updateState,
    currentPath: buildHomeFilterPath(basePath, state),
  };
}

function cleanFilters(filters: Filters): Filters {
  return {
    regions: cleanList(filters.regions),
    orgs: cleanList(filters.orgs),
    cats: cleanList(filters.cats),
    status: cleanList(filters.status),
    beginner: filters.beginner || undefined,
    natural: filters.natural || undefined,
    regional: filters.regional || undefined,
    proPath: filters.proPath || undefined,
    internationalRoute: filters.internationalRoute || undefined,
  };
}

function cleanList(values: string[] | undefined) {
  const cleaned = values?.map((value) => value.trim()).filter(Boolean);

  return cleaned && cleaned.length > 0 ? cleaned : undefined;
}
