from django.db.models import Count, Avg, F, FloatField, ExpressionWrapper
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Ticket
from .serializers import TicketSerializer
from .llm_service import classify_ticket


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all().order_by('-created_at')
    serializer_class = TicketSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'priority', 'status']
    search_fields = ['title', 'description']
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        qs = Ticket.objects.all()
        total = qs.count()
        open_count = qs.filter(status='open').count()

        # DB-level aggregation for priority and category breakdowns
        priority_qs = (
            qs.values('priority')
            .annotate(count=Count('id'))
        )
        category_qs = (
            qs.values('category')
            .annotate(count=Count('id'))
        )

        priority_breakdown = {row['priority']: row['count'] for row in priority_qs}
        # Fill in zeros for missing values
        for p in ['low', 'medium', 'high', 'critical']:
            priority_breakdown.setdefault(p, 0)

        category_breakdown = {row['category']: row['count'] for row in category_qs}
        for c in ['billing', 'technical', 'account', 'general']:
            category_breakdown.setdefault(c, 0)

        # Average tickets per day (DB-level: group by date, then average)
        avg_per_day = 0.0
        if total > 0:
            daily_counts = (
                qs.annotate(date=TruncDate('created_at'))
                .values('date')
                .annotate(day_count=Count('id'))
                .aggregate(avg=Avg('day_count'))
            )
            avg_per_day = round(daily_counts['avg'] or 0, 1)

        return Response({
            'total_tickets': total,
            'open_tickets': open_count,
            'avg_tickets_per_day': avg_per_day,
            'priority_breakdown': priority_breakdown,
            'category_breakdown': category_breakdown,
        })

    @action(detail=False, methods=['post'], url_path='classify')
    def classify(self, request):
        description = request.data.get('description', '').strip()
        if not description:
            return Response(
                {'error': 'description is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = classify_ticket(description)
        if result is None:
            return Response(
                {'error': 'Classification unavailable'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(result)