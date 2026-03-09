from fastapi import APIRouter
from app.api.v1 import (
    search,
    entities,
    graph,
    screener,
    rankings,
    priorities,
    patents,
    research,
    procurement,
    normative,
    strategic,
    events,
    ownership,
    scenario,
    compliance,
    timeline,
)

router = APIRouter()

router.include_router(search.router)
router.include_router(entities.router)
router.include_router(graph.router)
router.include_router(screener.router)
router.include_router(rankings.router)
router.include_router(priorities.router)
router.include_router(patents.router)
router.include_router(research.router)
router.include_router(procurement.router)
router.include_router(normative.router)
router.include_router(strategic.router)
router.include_router(events.router)
router.include_router(ownership.router)
router.include_router(scenario.router)
router.include_router(compliance.router)
router.include_router(timeline.router)
