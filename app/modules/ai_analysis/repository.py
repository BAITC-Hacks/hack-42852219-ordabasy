class AnalysisReferenceRepository:
    """Stores local wording and recommendations for the MVP analyzer."""

    METRIC_LABELS = {
        "mobility": "мобильность",
        "environment": "экология",
        "health": "здоровье",
        "safety": "безопасность",
        "economy": "экономика",
    }
    RECOMMENDATIONS = {
        "mobility": "Добавьте меры по общественному транспорту и зимней мобильности.",
        "environment": "Усильте экологические меры и мониторинг качества воздуха.",
        "health": "Рассмотрите профилактические и цифровые медицинские программы.",
        "safety": "Усильте освещение, переходы и работу с аварийными участками.",
        "economy": "Поддержите городские стартапы и занятость в инновационном секторе.",
    }

    def metric_label(self, metric: str) -> str:
        return self.METRIC_LABELS[metric]

    def recommendation(self, metric: str) -> str:
        return self.RECOMMENDATIONS[metric]

